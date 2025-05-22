import React from 'react';
import styled from 'styled-components';

const SimpleProjectDetail = ({ project, onBack }) => {
  console.log('SimpleProjectDetail render with:', project);

  if (!project) {
    return <div>No project selected</div>;
  }

  return (
    <DetailContainer>
      <Header>
        <BackButton onClick={onBack}>← Back</BackButton>
        <StatusBadge>{project.status}</StatusBadge>
      </Header>

      <Title>{project.title}</Title>

      <InfoSection>
        <InfoItem>
          <Label>ID:</Label>
          <Value>{project.id || project._id}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Status:</Label>
          <Value>{project.status}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Created:</Label>
          <Value>{new Date(project.createdAt).toLocaleString()}</Value>
        </InfoItem>
      </InfoSection>
    </DetailContainer>
  );
};

const DetailContainer = styled.div`
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    color: #000;
  }
`;

const StatusBadge = styled.span`
  padding: 0.35rem 0.75rem;
  background-color: #e3f2fd;
  color: #0d47a1;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #333;
`;

const Description = styled.p`
  color: #555;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 6px;
`;

const InfoItem = styled.div`
  display: flex;
`;

const Label = styled.span`
  font-weight: 500;
  width: 100px;
`;

const Value = styled.span`
  color: #444;
`;

export default SimpleProjectDetail;