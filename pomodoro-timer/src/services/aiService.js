// AI Service for DeepSeek API integration
// Please install OpenAI SDK first: `npm install openai`
import OpenAI from "openai";

// SECURITY NOTE: In a production environment, API keys should never be exposed in client-side code.
// The proper approach is to create a backend proxy service that makes the API calls and keeps the API key secure.
// For this open-source version, you need to provide your own API key.
// Get your API key from: https://platform.deepseek.com/
const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || '';

// Initialize OpenAI client with DeepSeek base URL
const openai = DEEPSEEK_API_KEY ? new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: DEEPSEEK_API_KEY,
  dangerouslyAllowBrowser: true // Required for browser environments
}) : null;

// Cache for storing recent API responses
const apiCache = new Map();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Sanitize and extract JSON from AI response
 * @param {string} content - The raw content from AI
 * @returns {string} - Sanitized content ready for JSON parsing
 */
const sanitizeAIResponse = (content) => {
  if (!content) return '{}';

  // Remove markdown code block markers if present
  content = content.replace(/```json\s+/g, '');
  content = content.replace(/```\s*$/g, '');
  content = content.replace(/```/g, '');

  // Remove any explanatory text before or after the JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    content = jsonMatch[0];
  }

  // Fix common JSON issues

  // Fix trailing commas in arrays and objects
  content = content.replace(/,\s*([}\]])/g, '$1');

  // Fix missing commas between array elements
  content = content.replace(/\]([^,\s}])/g, '],$1');

  // Fix unquoted property names
  content = content.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

  // Fix single quotes used instead of double quotes
  content = content.replace(/'/g, '"');

  // Fix escaped quotes inside strings
  content = content.replace(/\\"/g, '\\\\"');

  return content;
};

/**
 * Generate a project structure from a description using DeepSeek API
 * @param {string} description - The project description
 * @param {string} promptTemplate - The prompt template to use
 * @param {function} onStreamUpdate - Optional callback for stream updates
 * @returns {Promise<Object>} - The generated project structure
 */
export const generateProject = async (description, promptTemplate, onStreamUpdate = null) => {
  if (!description || !description.trim()) {
    throw new Error('Project description is required');
  }

  if (!openai) {
    throw new Error('AI service is not configured. Please add your DeepSeek API key to the environment variables (REACT_APP_DEEPSEEK_API_KEY).');
  }

  // Replace the placeholder in the prompt with the user's description
  const prompt = promptTemplate.replace('"""\n"""', `"""\n${description}\n"""`);

  // Create a cache key based on the description (simplified version of the description for better cache hits)
  const cacheKey = description.trim().toLowerCase().slice(0, 100);

  // Check if we have a cached response
  if (apiCache.has(cacheKey) && !onStreamUpdate) { // Don't use cache for streaming
    const cachedData = apiCache.get(cacheKey);
    if (Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
      console.log('Using cached project structure');
      return {
        ...cachedData.data,
        generationTime: cachedData.generationTime || 0,
        fromCache: true
      };
    } else {
      // Cache expired, remove it
      apiCache.delete(cacheKey);
    }
  }

  // Retry configuration
  const MAX_RETRIES = 2;
  let retryCount = 0;

  // Start timing the generation process
  const startTime = Date.now();

  // Flag to determine if we're using streaming
  const useStreaming = !!onStreamUpdate;

  async function attemptApiCall() {
    // Set up a timeout for the API call (using AbortController for compatibility)
    const timeoutDuration = 100000; // 100 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    try {
      if (useStreaming) {
        // For streaming mode
        let streamContent = '';
        let jsonStarted = false;
        let jsonContent = '';
        let openBraces = 0;
        let closeBraces = 0;

        // Call DeepSeek API using OpenAI SDK with streaming enabled
        const stream = await openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.2, // Lower temperature for more deterministic and faster responses
          max_tokens: 4000, // Reduced token count for faster responses
          timeout: 100000, // Set explicit timeout in milliseconds
          stream: true, // Enable streaming
        }, {
          signal: controller.signal
        });

        // Process the stream
        for await (const chunk of stream) {
          // Clear timeout on first chunk
          if (streamContent === '') {
            clearTimeout(timeoutId);
          }

          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            streamContent += content;

            // Try to detect JSON structure in the stream
            if (!jsonStarted && content.includes('{')) {
              jsonStarted = true;
            }

            if (jsonStarted) {
              jsonContent += content;

              // Count opening and closing braces to detect complete JSON
              for (const char of content) {
                if (char === '{') openBraces++;
                if (char === '}') closeBraces++;
              }

              // Try to extract partial JSON structures even if not complete
              try {
                console.log('Processing chunk, current content length:', streamContent.length);

                // Extract any JSON-like structure we can find
                let partialJson = {};
                let hasAnyContent = false;

                // Try to extract project details
                try {
                  const projectRegex = /"project"\s*:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/;
                  const projectMatch = jsonContent.match(projectRegex);
                  if (projectMatch) {
                    try {
                      const projectStr = `{${projectMatch[1]}}`;
                      const sanitizedProject = sanitizeAIResponse(`{"project":${projectStr}}`);
                      const parsedProject = JSON.parse(sanitizedProject);
                      if (parsedProject && parsedProject.project) {
                        partialJson.project = parsedProject.project;
                        hasAnyContent = true;
                        console.log('Extracted project:', parsedProject.project);
                      }
                    } catch (e) {
                      console.log('Project parsing error:', e.message);
                    }
                  }
                } catch (e) {
                  console.log('Project extraction error:', e.message);
                }

                // Try to extract milestones - even partial ones
                try {
                  // First try to get the entire milestones array
                  const milestonesRegex = /"milestones"\s*:\s*\[([\s\S]*?)(?:\](?:\s*,|\s*\})|\Z)/;
                  const milestonesMatch = milestonesRegex.exec(jsonContent);

                  if (milestonesMatch) {
                    const milestonesContent = milestonesMatch[1].trim();

                    // If we have any content, try to parse individual milestones
                    if (milestonesContent) {
                      // Split by possible milestone separators and filter out empty entries
                      const milestoneEntries = milestonesContent
                        .split(/},\s*\{/)
                        .map(entry => entry.trim())
                        .filter(entry => entry);

                      if (milestoneEntries.length > 0) {
                        const milestones = [];

                        // Process each potential milestone
                        for (let entry of milestoneEntries) {
                          // Add braces if they're missing
                          if (!entry.startsWith('{')) entry = '{' + entry;
                          if (!entry.endsWith('}')) entry = entry + '}';

                          try {
                            const sanitizedEntry = sanitizeAIResponse(entry);
                            const milestone = JSON.parse(sanitizedEntry);

                            // Add required fields for milestones
                            if (!milestone._id) milestone._id = "MILESTONE_ID_PLACEHOLDER";
                            if (!milestone.user) milestone.user = "USER_ID_PLACEHOLDER";
                            if (!milestone.project) milestone.project = "PROJECT_ID_PLACEHOLDER";

                            milestones.push(milestone);

                            // Create a copy of the current partial JSON for immediate update
                            const updatedPartialJson = { ...partialJson };

                            // Add this milestone to the existing milestones or create a new array
                            updatedPartialJson.milestones = updatedPartialJson.milestones || [];

                            // Check if this milestone is already in the array (by title)
                            const existingMilestoneIndex = updatedPartialJson.milestones.findIndex(
                              m => m.title === milestone.title
                            );

                            if (existingMilestoneIndex === -1) {
                              // This is a new milestone, add it
                              updatedPartialJson.milestones.push(milestone);
                              console.log(`Extracted new milestone: ${milestone.title}`);

                              // Send an immediate update with this new milestone
                              if (onStreamUpdate && updatedPartialJson.milestones.length > 0) {
                                hasAnyContent = true;

                                // Log the milestone being sent for debugging
                                console.log('Sending immediate milestone update:', milestone.title);

                                onStreamUpdate({
                                  partialContent: streamContent,
                                  partialJson: updatedPartialJson,
                                  isComplete: false
                                });

                                // Update the main partialJson for future updates
                                partialJson = { ...updatedPartialJson };
                              }
                            }
                          } catch (e) {
                            // Skip invalid entries
                            console.log('Invalid milestone entry:', e);
                          }
                        }

                        if (milestones.length > 0) {
                          partialJson.milestones = milestones;
                          hasAnyContent = true;
                          console.log(`Extracted ${milestones.length} milestones`);
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.log('Milestones extraction error:', e.message);
                }

                // Try to extract tasks - even partial ones and send updates for each task
                try {
                  // First try to get the entire tasks array - try both "tasks" and standalone array format
                  let tasksRegex = /"tasks"\s*:\s*\[([\s\S]*?)(?:\](?:\s*,|\s*\})|\Z)/;
                  let tasksMatch = tasksRegex.exec(jsonContent);

                  // Log the current JSON content for debugging
                  console.log('Current JSON content for task extraction:', jsonContent.substring(0, 500) + '...');

                  // If no match with "tasks" key, try to find a standalone array
                  if (!tasksMatch) {
                    // Try to match a standalone array at the beginning of the content
                    // This pattern specifically looks for arrays that start with _id field
                    tasksRegex = /\[\s*\{\s*"_id"\s*:\s*"[^"]*"[\s\S]*?\]\s*,?/;
                    tasksMatch = tasksRegex.exec(jsonContent);

                    // Log what we found for debugging
                    if (tasksMatch) {
                      console.log('Found standalone tasks array format at beginning');

                      // Extract the array content without the outer brackets
                      const arrayContent = tasksMatch[0].trim();
                      // Remove the trailing comma if present
                      const cleanedContent = arrayContent.endsWith(',')
                        ? arrayContent.substring(0, arrayContent.length - 1)
                        : arrayContent;

                      // Create a temporary object with tasks property
                      try {
                        const parsedArray = JSON.parse(cleanedContent);

                        // Update partialJson with the tasks
                        partialJson.tasks = parsedArray;
                        console.log('Successfully parsed tasks array:', parsedArray.length);
                      } catch (parseError) {
                        console.error('Error parsing tasks array:', parseError);
                        console.log('Problematic content:', cleanedContent);

                        // Try to manually extract tasks by splitting the array
                        try {
                          // Split by task objects (assuming each task is a separate object)
                          const taskStrings = cleanedContent.substring(1, cleanedContent.length - 1)
                            .split(/},\s*{/)
                            .map((task, index) => {
                              // Add braces back for each task
                              if (index === 0) return task + '}';
                              if (index === taskStrings.length - 1) return '{' + task;
                              return '{' + task + '}';
                            });

                          // Parse each task individually
                          const tasks = [];
                          for (const taskStr of taskStrings) {
                            try {
                              const task = JSON.parse(taskStr);
                              tasks.push(task);
                            } catch (e) {
                              console.log('Failed to parse individual task:', e);
                            }
                          }

                          if (tasks.length > 0) {
                            partialJson.tasks = tasks;
                            console.log('Manually extracted tasks:', tasks.length);
                          }
                        } catch (manualError) {
                          console.error('Failed manual task extraction:', manualError);
                        }
                      }
                      hasAnyContent = true;

                      // Send an immediate update with these tasks
                      if (onStreamUpdate) {
                        onStreamUpdate({
                          partialContent: streamContent,
                          partialJson: partialJson,
                          isComplete: false
                        });
                      }

                      // Continue with regular processing, but we've already handled the tasks
                      console.log(`Extracted ${partialJson.tasks.length} tasks from standalone array`);
                      // Don't return here, continue with the rest of the processing
                    }
                  }

                  // If we still don't have tasks, try a more aggressive approach
                  if (!partialJson.tasks || partialJson.tasks.length === 0) {
                    console.log('Trying alternative task extraction method');

                    // Look for any object with a title and estimatedPomodoros - likely a task
                    const taskObjectRegex = /\{\s*"(?:_id|title)"[^}]*"estimatedPomodoros"\s*:\s*\d+[^}]*\}/g;
                    const taskMatches = jsonContent.match(taskObjectRegex);

                    if (taskMatches && taskMatches.length > 0) {
                      console.log(`Found ${taskMatches.length} potential task objects`);

                      const tasks = [];
                      for (const taskStr of taskMatches) {
                        try {
                          const sanitizedTaskStr = sanitizeAIResponse(taskStr);
                          const task = JSON.parse(sanitizedTaskStr);

                          // Verify this looks like a task
                          if (task.title && typeof task.estimatedPomodoros === 'number') {
                            // Ensure required fields
                            if (!task.subtasks) task.subtasks = [];
                            if (task.completed === undefined) task.completed = false;

                            // Add required fields for tasks
                            if (!task._id) task._id = "TASK_ID_PLACEHOLDER";
                            if (!task.user) task.user = "USER_ID_PLACEHOLDER";
                            if (!task.project) task.project = "PROJECT_ID_PLACEHOLDER";
                            if (!task.source) task.source = "app";
                            if (!task.dueDate) task.dueDate = null;

                            tasks.push(task);
                            console.log(`Added task: ${task.title}`);
                          }
                        } catch (e) {
                          console.log('Failed to parse potential task:', e);
                        }
                      }

                      if (tasks.length > 0) {
                        partialJson.tasks = tasks;
                        hasAnyContent = true;

                        // Send an immediate update with these tasks
                        if (onStreamUpdate) {
                          onStreamUpdate({
                            partialContent: streamContent,
                            partialJson: partialJson,
                            isComplete: false
                          });
                        }

                        console.log(`Extracted ${tasks.length} tasks using alternative method`);
                      }
                    }
                  }

                  // Ensure tasks and milestones are distinct
                  if (partialJson.tasks && partialJson.tasks.length > 0 &&
                      partialJson.milestones && partialJson.milestones.length > 0) {
                    // Check if any task titles match milestone titles (which would be a mistake)
                    const taskTitles = new Set(partialJson.tasks.map(t => t.title));
                    partialJson.milestones = partialJson.milestones.filter(milestone => {
                      if (taskTitles.has(milestone.title)) {
                        console.log(`Removing duplicate milestone that's also a task: ${milestone.title}`);
                        return false;
                      }
                      return true;
                    });
                  }

                  if (tasksMatch) {
                    const tasksContent = tasksMatch[1].trim();

                    // If we have any content, try to parse individual tasks
                    if (tasksContent) {
                      // This is tricky because tasks can have nested subtasks
                      // We'll use a simple heuristic to split tasks
                      const taskEntries = [];
                      let currentTask = '';
                      let braceCount = 0;
                      let inTask = false;

                      for (let i = 0; i < tasksContent.length; i++) {
                        const char = tasksContent[i];
                        currentTask += char;

                        if (char === '{') {
                          braceCount++;
                          inTask = true;
                        } else if (char === '}') {
                          braceCount--;

                          // If we've closed all braces, we've reached the end of a task
                          if (braceCount === 0 && inTask) {
                            taskEntries.push(currentTask);

                            // Try to parse this task immediately and send an update
                            try {
                              const sanitizedEntry = sanitizeAIResponse(currentTask);
                              const task = JSON.parse(sanitizedEntry);

                              // Create a copy of the current partial JSON
                              const updatedPartialJson = { ...partialJson };

                              // Add this task to the existing tasks or create a new array
                              updatedPartialJson.tasks = updatedPartialJson.tasks || [];

                              // Check if this task is already in the array (by title)
                              const existingTaskIndex = updatedPartialJson.tasks.findIndex(
                                t => t.title === task.title
                              );

                              if (existingTaskIndex === -1) {
                                // This is a new task, add it
                                updatedPartialJson.tasks.push(task);
                                console.log(`Extracted new task: ${task.title}`);

                                // Send an immediate update with this new task
                                if (onStreamUpdate && updatedPartialJson.tasks.length > 0) {
                                  hasAnyContent = true;

                                  // Log the task being sent for debugging
                                  console.log('Sending immediate task update:', task.title);

                                  onStreamUpdate({
                                    partialContent: streamContent,
                                    partialJson: updatedPartialJson,
                                    isComplete: false
                                  });

                                  // Update the main partialJson for future updates
                                  partialJson = { ...updatedPartialJson };
                                }
                              }
                            } catch (taskParseError) {
                              // Skip invalid entries but continue processing
                              console.log('Invalid immediate task entry:', taskParseError.message);
                            }

                            currentTask = '';
                            inTask = false;
                          }
                        }
                      }

                      // Add the last task if there's content and we're not in the middle of a task
                      if (currentTask.trim() && braceCount === 0) {
                        taskEntries.push(currentTask);
                      }

                      // Process all tasks again to ensure we have a complete list
                      // This is a safety measure in case some tasks were not properly parsed earlier
                      if (taskEntries.length > 0) {
                        const tasks = [];

                        // Process each potential task
                        for (let entry of taskEntries) {
                          try {
                            const sanitizedEntry = sanitizeAIResponse(entry);
                            const task = JSON.parse(sanitizedEntry);
                            tasks.push(task);
                          } catch (e) {
                            // Skip invalid entries
                            console.log('Invalid task entry:', e.message);
                          }
                        }

                        if (tasks.length > 0) {
                          // Only update if we have more tasks than before
                          if (!partialJson.tasks || tasks.length > partialJson.tasks.length) {
                            partialJson.tasks = tasks;
                            hasAnyContent = true;
                            console.log(`Extracted ${tasks.length} tasks in total`);
                          }
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.log('Tasks extraction error:', e.message);
                }

                // Try to extract notes - even partial ones and send updates for each note
                try {
                  // First try to get the entire notes array
                  const notesRegex = /"notes"\s*:\s*\[([\s\S]*?)(?:\](?:\s*,|\s*\})|\Z)/;
                  const notesMatch = notesRegex.exec(jsonContent);

                  if (notesMatch) {
                    const notesContent = notesMatch[1].trim();

                    // If we have any content, try to parse individual notes
                    if (notesContent) {
                      // Split by possible note separators and filter out empty entries
                      const noteEntries = notesContent
                        .split(/},\s*\{/)
                        .map(entry => entry.trim())
                        .filter(entry => entry);

                      if (noteEntries.length > 0) {
                        const notes = [];
                        let noteIndex = 0;

                        // Process each potential note
                        for (let entry of noteEntries) {
                          // Add braces if they're missing
                          if (!entry.startsWith('{')) entry = '{' + entry;
                          if (!entry.endsWith('}')) entry = entry + '}';

                          try {
                            const sanitizedEntry = sanitizeAIResponse(entry);
                            const note = JSON.parse(sanitizedEntry);

                            // Add required fields for notes
                            if (!note._id) note._id = "NOTE_ID_PLACEHOLDER";
                            if (!note.user) note.user = "USER_ID_PLACEHOLDER";
                            if (!note.project) note.project = "PROJECT_ID_PLACEHOLDER";
                            if (!note.position) note.position = noteIndex++;
                            if (!note.color) note.color = ["yellow", "green", "blue", "purple", "pink"][Math.floor(Math.random() * 5)];

                            notes.push(note);

                            // Create a copy of the current partial JSON for immediate update
                            const updatedPartialJson = { ...partialJson };

                            // Add this note to the existing notes or create a new array
                            updatedPartialJson.notes = updatedPartialJson.notes || [];

                            // Check if this note is already in the array (by content)
                            const existingNoteIndex = updatedPartialJson.notes.findIndex(
                              n => n.content === note.content
                            );

                            if (existingNoteIndex === -1) {
                              // This is a new note, add it
                              updatedPartialJson.notes.push(note);
                              console.log(`Extracted new note: ${note.content.substring(0, 30)}...`);

                              // Send an immediate update with this new note
                              if (onStreamUpdate && updatedPartialJson.notes.length > 0) {
                                hasAnyContent = true;

                                // Log the note being sent for debugging
                                console.log('Sending immediate note update:', note.content.substring(0, 30));

                                onStreamUpdate({
                                  partialContent: streamContent,
                                  partialJson: updatedPartialJson,
                                  isComplete: false
                                });

                                // Update the main partialJson for future updates
                                partialJson = { ...updatedPartialJson };

                                // Add a small delay to ensure notes appear one by one
                                // Using setTimeout instead of await since this is not an async function
                                setTimeout(() => {}, 100);
                              }
                            }
                          } catch (e) {
                            // Skip invalid entries
                            console.log('Invalid note entry:', e.message);
                          }
                        }

                        // Ensure we have all notes in the partialJson
                        if (notes.length > 0 && (!partialJson.notes || notes.length > partialJson.notes.length)) {
                          partialJson.notes = notes;
                          hasAnyContent = true;
                          console.log(`Extracted ${notes.length} notes in total`);
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.log('Notes extraction error:', e.message);
                }

                // Send the partial JSON if we have any content
                if (hasAnyContent) {
                  console.log('Sending partial JSON update with:', Object.keys(partialJson));

                  if (onStreamUpdate) {
                    onStreamUpdate({
                      partialContent: streamContent,
                      partialJson: partialJson,
                      isComplete: false
                    });
                  }
                }

                // If we have a potentially complete full JSON, try to parse it
                if (openBraces > 0 && openBraces === closeBraces) {
                  // Try to extract JSON from the content
                  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    const potentialJson = sanitizeAIResponse(jsonMatch[0]);
                    const parsedJson = JSON.parse(potentialJson);

                    // If we have a valid project structure, send it to the callback
                    if (parsedJson && typeof parsedJson === 'object') {
                      if (onStreamUpdate) {
                        onStreamUpdate({
                          partialContent: streamContent,
                          partialJson: parsedJson,
                          isComplete: false
                        });
                      }
                    }
                  }
                }
              } catch (e) {
                // JSON extraction failed, continue collecting
                console.log('JSON extraction error:', e.message);
              }
            }

            // Always send content updates
            if (onStreamUpdate) {
              onStreamUpdate({
                partialContent: streamContent,
                isComplete: false
              });
            }
          }
        }

        // Return the complete content from the stream
        return streamContent;
      } else {
        // Non-streaming mode (original implementation)
        const completion = await openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.2, // Lower temperature for more deterministic and faster responses
          max_tokens: 4000, // Reduced token count for faster responses
          timeout: 100000, // Set explicit timeout in milliseconds
        }, {
          signal: controller.signal
        });

        // Clear the timeout
        clearTimeout(timeoutId);

        // Extract content from the response
        return completion.choices?.[0]?.message?.content;
      }
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      throw error;
    }
  }

  try {
    let content;
    let lastError;

    // Try to call the API with retries
    while (retryCount <= MAX_RETRIES) {
      try {
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount}/${MAX_RETRIES}...`);
        }

        content = await attemptApiCall();
        break; // If successful, exit the retry loop
      } catch (error) {
        lastError = error;
        retryCount++;

        if (retryCount <= MAX_RETRIES) {
          // Wait before retrying (exponential backoff)
          const waitTime = 2000 * Math.pow(2, retryCount - 1);
          console.log(`API call failed, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // If we've exhausted all retries and still don't have content, throw the last error
    if (!content) {
      throw lastError || new Error('Failed to get response after retries');
    }

    console.log('Raw AI response received, attempting to parse...');

    // Sanitize the content before parsing
    const sanitizedContent = sanitizeAIResponse(content);

    // Try to parse JSON from the sanitized AI response
    let json;
    try {
      json = JSON.parse(sanitizedContent);
      console.log('Successfully parsed JSON from sanitized content');
    } catch (e) {
      console.error('JSON parse error after sanitization:', e.message);

      // Last resort: Try to manually construct a valid project structure
      try {
        // Extract project title using regex
        const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : "Generated Project";

        // Extract description using regex
        const descMatch = content.match(/"description"\s*:\s*"([^"]+)"/);
        const description = descMatch ? descMatch[1] : "Generated from AI";

        // Create a minimal valid project structure
        json = {
          project: {
            title: title,
            description: description,
            deadline: null
          },
          milestones: [],
          tasks: [],
          notes: []
        };

        console.log('Created fallback project structure');
      } catch (fallbackError) {
        console.error('Failed to create fallback structure:', fallbackError.message);
        throw new Error('Failed to parse AI response: ' + e.message);
      }
    }

    // Validate the structure of the JSON
    if (!json.project || typeof json.project !== 'object') {
      console.error('Invalid project structure, missing project object');
      json.project = {
        title: "Generated Project",
        description: "Generated from AI",
        deadline: null
      };
    }

    // Ensure all required arrays exist
    if (!Array.isArray(json.milestones)) json.milestones = [];
    if (!Array.isArray(json.tasks)) json.tasks = [];
    if (!Array.isArray(json.notes)) json.notes = [];

    // Calculate generation time
    const endTime = Date.now();
    const generationTime = endTime - startTime;

    // Add generation time to the result
    const resultWithTime = {
      ...json,
      generationTime,
      fromCache: false
    };

    // Cache the result
    apiCache.set(cacheKey, {
      data: json,
      timestamp: Date.now(),
      generationTime
    });

    console.log(`Project generation completed in ${generationTime / 1000} seconds`);

    // If we're using streaming, send the final complete result
    if (useStreaming && onStreamUpdate) {
      onStreamUpdate({
        partialContent: content,
        partialJson: json,
        isComplete: true,
        generationTime,
        finalResult: resultWithTime
      });
    }

    return resultWithTime;
  } catch (error) {
    console.error('Error generating project:', error);

    // Provide more user-friendly error messages
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again with a simpler description or try later when the service is less busy.');
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      throw new Error('Connection to AI service was interrupted. Please try again.');
    } else if (error.status === 429 || (error.response && error.response.status === 429)) {
      throw new Error('Too many requests to the AI service. Please wait a moment and try again.');
    } else if (error.message && error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again with a simpler description.');
    } else {
      throw new Error(`Error generating project: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Generate subtasks for a task using DeepSeek API
 * @param {string} taskDescription - The task description
 * @param {string} promptTemplate - The prompt template to use
 * @param {string} model - The model to use (deepseek-chat or deepseek-reasoner)
 * @returns {Promise<Object>} - The generated subtasks
 */
export const generateSubtasks = async (taskDescription, promptTemplate, model = 'deepseek-chat') => {
  if (!taskDescription || !taskDescription.trim()) {
    throw new Error('Task description is required');
  }

  if (!openai) {
    throw new Error('AI service is not configured. Please add your DeepSeek API key to the environment variables (REACT_APP_DEEPSEEK_API_KEY).');
  }

  // Retry configuration
  const MAX_RETRIES = 2;
  let retryCount = 0;

  async function attemptApiCall() {
    // Set up a timeout for the API call
    const timeoutDuration = 60000; // 60 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    try {
      // Call DeepSeek API using OpenAI SDK
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: promptTemplate },
          { role: 'user', content: `"""${taskDescription}"""` },
        ],
        temperature: 0.2, // Lower temperature for more deterministic and faster responses
        max_tokens: 2000, // Reduced token count for faster responses
        timeout: 55000, // Set explicit timeout in milliseconds
      }, {
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Extract content from the response
      return completion.choices?.[0]?.message?.content;
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      throw error;
    }
  }

  try {
    let content;
    let lastError;

    // Try to call the API with retries
    while (retryCount <= MAX_RETRIES) {
      try {
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount}/${MAX_RETRIES} for subtasks...`);
        }

        content = await attemptApiCall();
        break; // If successful, exit the retry loop
      } catch (error) {
        lastError = error;
        retryCount++;

        if (retryCount <= MAX_RETRIES) {
          // Wait before retrying (exponential backoff)
          const waitTime = 2000 * Math.pow(2, retryCount - 1);
          console.log(`API call failed, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // If we've exhausted all retries and still don't have content, throw the last error
    if (!content) {
      throw lastError || new Error('Failed to get response after retries');
    }

    console.log('Raw AI subtasks response received, attempting to parse...');

    // Sanitize the content before parsing
    const sanitizedContent = sanitizeAIResponse(content);

    // Try to parse JSON from the sanitized AI response
    let json;
    try {
      json = JSON.parse(sanitizedContent);
      console.log('Successfully parsed subtasks JSON from sanitized content');
    } catch (e) {
      console.error('JSON parse error in generateSubtasks after sanitization:', e.message);

      // Last resort: Create a minimal valid subtasks structure
      json = {
        subtasks: []
      };

      console.log('Created fallback subtasks structure');
    }

    // Validate the structure of the JSON
    if (!Array.isArray(json.subtasks)) {
      console.error('Invalid subtasks structure, missing subtasks array');
      json.subtasks = [];
    }

    return json;
  } catch (error) {
    console.error('Error generating subtasks:', error);

    // Provide more user-friendly error messages
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again with a simpler description or try later when the service is less busy.');
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      throw new Error('Connection to AI service was interrupted. Please try again.');
    } else if (error.status === 429 || (error.response && error.response.status === 429)) {
      throw new Error('Too many requests to the AI service. Please wait a moment and try again.');
    } else if (error.message && error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again with a simpler description.');
    } else {
      throw new Error(`Error generating subtasks: ${error.message || 'Unknown error'}`);
    }
  }
};

export const aiService = {
  generateProject,
  generateSubtasks
};

export default aiService;
