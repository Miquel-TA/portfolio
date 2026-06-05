import React, { useState, useEffect } from 'react';

const Admin = ({ data, reloadData }) => {
  const [token, setToken] = useState(localStorage.getItem('jwt_token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (data && data.blocks) {
      setBlocks(JSON.parse(JSON.stringify(data.blocks)));
    }
  }, [data]);

  useEffect(() => {
    if (data && data.blocks) {
      setHasChanges(JSON.stringify(blocks) !== JSON.stringify(data.blocks));
    }
  }, [blocks, data]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const result = await response.json();
        setToken(result.token);
        localStorage.setItem('jwt_token', result.token);
      } else {
        setLoginError('Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Login failed');
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('jwt_token');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ blocks })
      });
      if (response.ok) {
        alert('Data saved successfully!');
        reloadData();
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        handleLogout();
      } else {
        alert('Failed to save data.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving data.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (type) => {
    const newBlock = {
      id: Date.now().toString(),
      type,
      content: {}
    };
    if (type === 'header') newBlock.content = { title: 'New Title', subtitle: 'New Subtitle', avatar: '' };
    if (type === 'about') newBlock.content = { text: 'About text' };
    if (type === 'experience') newBlock.content = { items: [{ role: 'Role', company: 'Company', period: 'Period', description: 'Desc' }] };
    if (type === 'education') newBlock.content = { items: [{ degree: 'Degree', institution: 'Institution', period: 'Period', description: 'Desc' }] };
    if (type === 'skills') newBlock.content = { skills: ['Skill 1'] };
    if (type === 'projects') newBlock.content = { items: [{ title: 'Project', link: 'https://github.com/example' }] };

    setBlocks([...blocks, newBlock]);
  };

  const handleRemoveBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlockUp = (index) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index - 1];
    newBlocks[index - 1] = newBlocks[index];
    newBlocks[index] = temp;
    setBlocks(newBlocks);
  };

  const moveBlockDown = (index) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index + 1];
    newBlocks[index + 1] = newBlocks[index];
    newBlocks[index] = temp;
    setBlocks(newBlocks);
  };

  const updateBlockContent = (id, field, value) => {
    setBlocks(blocks.map(b => {
      if (b.id === id) {
        return { ...b, content: { ...b.content, [field]: value } };
      }
      return b;
    }));
  };

  const updateArrayItem = (blockId, itemIndex, field, value) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        const newItems = [...(b.content.items || [])];
        newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
        return { ...b, content: { ...b.content, items: newItems } };
      }
      return b;
    }));
  };

  const addArrayItem = (blockId, defaultItem) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, content: { ...b.content, items: [...(b.content.items || []), defaultItem] } };
      }
      return b;
    }));
  };

  const removeArrayItem = (blockId, itemIndex) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId) {
        const newItems = (b.content.items || []).filter((_, idx) => idx !== itemIndex);
        return { ...b, content: { ...b.content, items: newItems } };
      }
      return b;
    }));
  };

  const renderBlockEditor = (block) => {
    switch (block.type) {
      case 'header':
        return (
          <>
            <div className="form-group">
              <label>Title</label>
              <input className="form-control" value={block.content.title || ''} onChange={e => updateBlockContent(block.id, 'title', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <input className="form-control" value={block.content.subtitle || ''} onChange={e => updateBlockContent(block.id, 'subtitle', e.target.value)} />
            </div>
          </>
        );
      case 'about':
        return (
          <div className="form-group">
            <label>Text</label>
            <textarea className="form-control" value={block.content.text || ''} onChange={e => updateBlockContent(block.id, 'text', e.target.value)} />
          </div>
        );
      case 'experience':
        return (
          <div className="form-group">
            <label>Experience Items</label>
            {(block.content.items || []).map((item, idx) => (
              <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border-color)', marginBottom: '1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <input className="form-control" placeholder="Role" value={item.role || ''} onChange={e => updateArrayItem(block.id, idx, 'role', e.target.value)} />
                  <input className="form-control" placeholder="Company" value={item.company || ''} onChange={e => updateArrayItem(block.id, idx, 'company', e.target.value)} />
                  <input className="form-control" placeholder="Period" value={item.period || ''} onChange={e => updateArrayItem(block.id, idx, 'period', e.target.value)} />
                </div>
                <textarea className="form-control" placeholder="Description" value={item.description || ''} onChange={e => updateArrayItem(block.id, idx, 'description', e.target.value)} />
                <button className="btn btn-danger" style={{ marginTop: '0.5rem' }} onClick={() => removeArrayItem(block.id, idx)}>Remove Item</button>
              </div>
            ))}
            <button className="btn" style={{ backgroundColor: 'var(--success-color)', color: 'white' }} onClick={() => addArrayItem(block.id, { role: 'New Role', company: 'New Company', period: 'New Period', description: '' })}>+ Add Experience</button>
          </div>
        );
      case 'education':
        return (
          <div className="form-group">
            <label>Education Items</label>
            {(block.content.items || []).map((item, idx) => (
              <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border-color)', marginBottom: '1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <input className="form-control" placeholder="Degree" value={item.degree || ''} onChange={e => updateArrayItem(block.id, idx, 'degree', e.target.value)} />
                  <input className="form-control" placeholder="Institution" value={item.institution || ''} onChange={e => updateArrayItem(block.id, idx, 'institution', e.target.value)} />
                  <input className="form-control" placeholder="Period" value={item.period || ''} onChange={e => updateArrayItem(block.id, idx, 'period', e.target.value)} />
                </div>
                <textarea className="form-control" placeholder="Description" value={item.description || ''} onChange={e => updateArrayItem(block.id, idx, 'description', e.target.value)} />
                <button className="btn btn-danger" style={{ marginTop: '0.5rem' }} onClick={() => removeArrayItem(block.id, idx)}>Remove Item</button>
              </div>
            ))}
            <button className="btn" style={{ backgroundColor: 'var(--success-color)', color: 'white' }} onClick={() => addArrayItem(block.id, { degree: 'New Degree', institution: 'New Inst', period: 'New Period', description: '' })}>+ Add Education</button>
          </div>
        );
      case 'projects':
        return (
          <div className="form-group">
            <label>Project Items</label>
            {(block.content.items || []).map((item, idx) => (
              <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border-color)', marginBottom: '1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <input className="form-control" placeholder="Title" value={item.title || ''} onChange={e => updateArrayItem(block.id, idx, 'title', e.target.value)} />
                  <input className="form-control" placeholder="Link (URL)" value={item.link || ''} onChange={e => updateArrayItem(block.id, idx, 'link', e.target.value)} />
                </div>
                <button className="btn btn-danger" onClick={() => removeArrayItem(block.id, idx)}>Remove Item</button>
              </div>
            ))}
            <button className="btn" style={{ backgroundColor: 'var(--success-color)', color: 'white' }} onClick={() => addArrayItem(block.id, { title: 'New Project', link: 'https://' })}>+ Add Project</button>
          </div>
        );
      case 'skills':
        return (
          <div className="form-group">
            <label>Skills (comma separated)</label>
            <input 
              className="form-control" 
              value={block.content.skills ? block.content.skills.join(', ') : ''} 
              onChange={e => updateBlockContent(block.id, 'skills', e.target.value.split(',').map(s => s.trim()))} 
            />
          </div>
        );
      default:
        return <div>Unknown block type</div>;
    }
  };

  if (!token) {
    return (
      <div className="admin-login" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative', zIndex: 10 }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--accent-color)' }}>Admin Login</h2>
        {loginError && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center' }}>{loginError}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" required className="form-control" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-panel" style={{ position: 'relative', zIndex: 10 }}>
      {/* Sticky Header */}
      <div className="admin-header glass" style={{ position: 'sticky', top: '75px', zIndex: 90, padding: '1rem 1.5rem', margin: '-1rem -1.5rem 2rem -1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, padding: 0 }}>Admin Dashboard</h2>
        <div>
          <button className="btn" style={{ marginRight: '1rem', backgroundColor: 'var(--danger-color)', color: 'white' }} onClick={handleLogout}>Logout</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            style={{ opacity: (!hasChanges && !saving) ? 0.5 : 1, cursor: (!hasChanges && !saving) ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => handleAddBlock('header')}>+ Header</button>
        <button className="btn" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => handleAddBlock('about')}>+ About</button>
        <button className="btn" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => handleAddBlock('experience')}>+ Experience</button>
        <button className="btn" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => handleAddBlock('education')}>+ Education</button>
        <button className="btn" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => handleAddBlock('skills')}>+ Skills</button>
        <button className="btn" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => handleAddBlock('projects')}>+ Projects</button>
      </div>

      {blocks.map((block, index) => (
        <div key={block.id} className="admin-block">
          <div className="admin-block-header">
            <h3 style={{fontFamily: "'Fira Code', monospace", color: 'var(--accent-color)'}}>{block.type.toUpperCase()} Block</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem' }} onClick={() => moveBlockUp(index)} disabled={index === 0}>↑</button>
              <button className="btn" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem' }} onClick={() => moveBlockDown(index)} disabled={index === blocks.length - 1}>↓</button>
              <button className="btn btn-danger" style={{ marginLeft: '0.5rem' }} onClick={() => handleRemoveBlock(block.id)}>Remove</button>
            </div>
          </div>
          {renderBlockEditor(block)}
        </div>
      ))}
    </div>
  );
};

export default Admin;
