import React from 'react';

const renderTextWithLineBreaks = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      <br />
    </React.Fragment>
  ));
};

const Portfolio = ({ data }) => {
  if (!data || !data.blocks) return <div>No data available</div>;

  return (
    <div className="portfolio">
      {data.blocks.map(block => {
        switch (block.type) {
          case 'header':
            return (
              <div key={block.id} className="block header-block glass">
                <h1>{block.content.title}</h1>
                <h2>{block.content.subtitle}</h2>
              </div>
            );
          case 'about':
            return (
              <div key={block.id} className="block about-block glass">
                <h3>About Me</h3>
                <p className="text-content">{renderTextWithLineBreaks(block.content.text)}</p>
              </div>
            );
          case 'experience':
            return (
              <div key={block.id} className="block experience-block glass">
                <h3>Experience</h3>
                {block.content.items && block.content.items.map((item, idx) => (
                  <div key={idx} className="experience-item">
                    <h4>{item.role}</h4>
                    <div className="meta">{item.company} | {item.period}</div>
                    <p className="text-content">{renderTextWithLineBreaks(item.description)}</p>
                  </div>
                ))}
              </div>
            );
          case 'education':
            return (
              <div key={block.id} className="block experience-block glass">
                <h3>Education</h3>
                {block.content.items && block.content.items.map((item, idx) => (
                  <div key={idx} className="experience-item">
                    <h4>{item.degree}</h4>
                    <div className="meta">{item.institution} | {item.period}</div>
                    <p className="text-content">{renderTextWithLineBreaks(item.description)}</p>
                  </div>
                ))}
              </div>
            );
          case 'skills':
            return (
              <div key={block.id} className="block skills-block glass">
                <h3>Skills</h3>
                <div className="skills-list">
                  {block.content.skills && block.content.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            );
          case 'projects':
            return (
              <div key={block.id} className="block projects-block glass">
                <h3>Projects</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {block.content.items && block.content.items.map((item, idx) => (
                    <div key={idx} className="experience-item" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                      <h4>{item.title}</h4>
                      <a href={item.link} className="meta" style={{ display: 'block', wordBreak: 'break-all' }} target="_blank" rel="noopener noreferrer">{item.link}</a>
                    </div>
                  ))}
                </div>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

export default Portfolio;
