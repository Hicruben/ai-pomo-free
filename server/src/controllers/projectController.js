const Project = require('../models/Project');
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const Note = require('../models/Note');

// Get all projects for the current user
exports.getProjects = async (req, res) => {
  try {
    const { status } = req.query;

    // Build filter object
    const filter = { user: req.user.id };
    if (status) {
      // Handle comma-separated status values
      const statusArray = status.split(',');
      filter.status = { $in: statusArray };
    }

    const projects = await Project.find(filter).sort({ position: 1, createdAt: -1 });

    // Get the Pomodoro model
    const Pomodoro = require('../models/Pomodoro');

    // Get completed pomodoros for all projects
    const projectIds = projects.map(project => project._id);
    const pomodoroAggregation = await Pomodoro.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          user: req.user._id,
          completed: true
        }
      },
      {
        $group: {
          _id: '$project',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of project ID to completed pomodoro count
    const pomodoroCountMap = {};
    pomodoroAggregation.forEach(item => {
      pomodoroCountMap[item._id.toString()] = item.count;
    });

    console.log(`[projectController] Pomodoro count map for projects:`, pomodoroCountMap);

    // Add completedPomodoros to each project
    const projectsWithPomodoros = projects.map(project => {
      const projectObj = project.toObject();
      projectObj.completedPomodoros = pomodoroCountMap[project._id.toString()] || 0;
      return projectObj;
    });

    res.json(projectsWithPomodoros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Calculate completedPomodoros from the pomodoro table
    const Pomodoro = require('../models/Pomodoro');
    const completedPomodoros = await Pomodoro.countDocuments({
      project: req.params.id,
      user: req.user.id,
      completed: true
    });

    console.log(`[projectController] Calculated completedPomodoros for project ${req.params.id}: ${completedPomodoros}`);

    // Convert to plain object to add the completedPomodoros field
    const projectObj = project.toObject();
    projectObj.completedPomodoros = completedPomodoros;

    res.json(projectObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { title, description, deadline } = req.body;

    console.log(`[projectController] Creating project for user: ${req.user.id}`);
    console.log(`[projectController] User object:`, req.user);
    console.log(`[projectController] Project data:`, { title, description, deadline });

    // Get all projects for this user
    const allUserProjects = await Project.find({ user: req.user.id });
    console.log(`[projectController] All user projects:`, allUserProjects.map(p => ({
      id: p._id.toString(),
      title: p.title,
      status: p.status
    })));

    // Count open and working projects
    const openProjects = allUserProjects.filter(p => p.status === 'open' || p.status === 'working');
    console.log(`[projectController] Open projects:`, openProjects.map(p => ({
      id: p._id.toString(),
      title: p.title,
      status: p.status
    })));

    const openProjectCount = openProjects.length;
    console.log(`[projectController] Open project count: ${openProjectCount}`);

    // Get the user's project limit from their profile
    const User = require('../models/User');
    const currentUser = await User.findById(req.user.id);
    const PROJECT_LIMIT = currentUser.maxProjects || 3;

    console.log(`[projectController] User's project limit: ${PROJECT_LIMIT}`);
    console.log(`[projectController] User's subscription status: ${currentUser.subscriptionStatus}`);
    console.log(`[projectController] User's subscription plan: ${currentUser.subscription.plan}`);

    // Get all projects for debugging
    const allProjects = await Project.find({ user: req.user.id });
    console.log(`[projectController] All projects for user:`, allProjects.map(p => ({
      id: p._id,
      title: p.title,
      status: p.status
    })));

    if (openProjectCount >= PROJECT_LIMIT) {
      console.log(`[projectController] Rejecting project creation - limit reached (${openProjectCount}/${PROJECT_LIMIT} open projects)`);
      return res.status(400).json({
        message: `You can have a maximum of ${PROJECT_LIMIT} open projects with your current plan. Please finish or delete an existing project first.`
      });
    }

    // Find the highest position value to place the new project at the end
    const highestPositionProject = await Project.findOne(
      { user: req.user.id },
      {},
      { sort: { position: -1 } }
    );

    const newPosition = highestPositionProject ? highestPositionProject.position + 1 : 0;

    const project = new Project({
      user: req.user.id,
      title,
      description,
      status: 'open',
      deadline: deadline ? new Date(deadline) : undefined,
      position: newPosition
    });

    await project.save();
    console.log(`[projectController] Project saved successfully:`, {
      id: project._id,
      title: project.title,
      status: project.status
    });

    // Add a small delay to ensure the database is updated
    await new Promise(resolve => setTimeout(resolve, 500));

    // For a new project, completedPomodoros will be 0
    const projectObj = project.toObject();
    projectObj.completedPomodoros = 0;

    res.status(201).json(projectObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  try {
    const { title, description, deadline } = req.body;

    // Find project
    let project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project belongs to user
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        title: title || project.title,
        description: description !== undefined ? description : project.description,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : project.deadline
      },
      { new: true }
    );

    // Calculate completedPomodoros from the pomodoro table
    const Pomodoro = require('../models/Pomodoro');
    const completedPomodoros = await Pomodoro.countDocuments({
      project: req.params.id,
      user: req.user.id,
      completed: true
    });

    console.log(`[projectController] Calculated completedPomodoros for updated project ${req.params.id}: ${completedPomodoros}`);

    // Convert to plain object to add the completedPomodoros field
    const projectObj = project.toObject();
    projectObj.completedPomodoros = completedPomodoros;

    res.json(projectObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    // Find project
    const project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project belongs to user
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete associated tasks, milestones, and notes
    await Task.deleteMany({ project: req.params.id });
    await Milestone.deleteMany({ project: req.params.id });
    await Note.deleteMany({ project: req.params.id });

    // Delete project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set project as "working on"
exports.setProjectAsWorking = async (req, res) => {
  try {
    // Find the project to set as working
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Reset any currently working project
    await Project.updateMany(
      { user: req.user.id, status: 'working' },
      { status: 'open' }
    );

    // Set the selected project as working
    project.status = 'working';
    await project.save();

    // Calculate completedPomodoros from the pomodoro table
    const Pomodoro = require('../models/Pomodoro');
    const completedPomodoros = await Pomodoro.countDocuments({
      project: req.params.id,
      user: req.user.id,
      completed: true
    });

    console.log(`[projectController] Calculated completedPomodoros for working project ${req.params.id}: ${completedPomodoros}`);

    // Convert to plain object to add the completedPomodoros field
    const projectObj = project.toObject();
    projectObj.completedPomodoros = completedPomodoros;

    res.json(projectObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark project as finished
exports.finishProject = async (req, res) => {
  try {
    // Find the project
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Set project as finished
    project.status = 'finished';
    project.completedDate = new Date();
    await project.save();

    // Calculate completedPomodoros from the pomodoro table
    const Pomodoro = require('../models/Pomodoro');
    const completedPomodoros = await Pomodoro.countDocuments({
      project: req.params.id,
      user: req.user.id,
      completed: true
    });

    console.log(`[projectController] Calculated completedPomodoros for finished project ${req.params.id}: ${completedPomodoros}`);

    // Convert to plain object to add the completedPomodoros field
    const projectObj = project.toObject();
    projectObj.completedPomodoros = completedPomodoros;

    res.json(projectObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project positions
exports.updateProjectPositions = async (req, res) => {
  try {
    const { positions } = req.body;

    if (!positions || !Array.isArray(positions)) {
      return res.status(400).json({ message: 'Invalid positions data' });
    }

    console.log(`[projectController] Updating project positions:`, positions);

    // Validate that all projects belong to the user
    for (const item of positions) {
      const project = await Project.findOne({
        _id: item.id,
        user: req.user.id
      });

      if (!project) {
        return res.status(404).json({
          message: `Project not found or not authorized: ${item.id}`
        });
      }
    }

    // Update positions
    const updatePromises = positions.map(item =>
      Project.findByIdAndUpdate(
        item.id,
        { position: item.position },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    // Get updated projects
    const updatedProjects = await Project.find({
      user: req.user.id,
      _id: { $in: positions.map(item => item.id) }
    }).sort({ position: 1 });

    // Calculate completedPomodoros for each project
    const Pomodoro = require('../models/Pomodoro');
    const projectIds = updatedProjects.map(project => project._id);
    const pomodoroAggregation = await Pomodoro.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          user: req.user._id,
          completed: true
        }
      },
      {
        $group: {
          _id: '$project',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of project ID to completed pomodoro count
    const pomodoroCountMap = {};
    pomodoroAggregation.forEach(item => {
      pomodoroCountMap[item._id.toString()] = item.count;
    });

    // Add completedPomodoros to each project
    const projectsWithPomodoros = updatedProjects.map(project => {
      const projectObj = project.toObject();
      projectObj.completedPomodoros = pomodoroCountMap[project._id.toString()] || 0;
      return projectObj;
    });

    res.json(projectsWithPomodoros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};