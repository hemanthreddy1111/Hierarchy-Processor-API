import { useState } from 'react';
import { Send, AlertCircle, RefreshCw, Layers, CheckCircle, AlertTriangle } from 'lucide-react';
import './index.css';

// Recursive component to render the tree
const TreeNode = ({ nodeName, nodeData, isRoot }) => {
  const childrenNames = Object.keys(nodeData);
  
  return (
    <div className={`tree-node ${isRoot ? 'tree-root' : ''}`}>
      <span className="tree-node-label">{nodeName}</span>
      {childrenNames.length > 0 && (
        <div className="tree-children">
          {childrenNames.map((childName) => (
            <TreeNode key={childName} nodeName={childName} nodeData={nodeData[childName]} isRoot={false} />
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [inputData, setInputData] = useState('[\n  "A->B", "A->C", "B->D", "C->E", "E->F",\n  "X->Y", "Y->Z", "Z->X",\n  "P->Q", "Q->R",\n  "G->H", "G->H", "G->I",\n  "hello", "1->2", "A->"\n]');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    let parsedData = [];
    try {
      // Allow user to enter just the array or the full JSON
      let raw = inputData.trim();
      if (!raw) throw new Error("Input cannot be empty");
      
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsedData = parsed;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        parsedData = parsed.data;
      } else {
        throw new Error("Invalid format. Provide a JSON array of strings.");
      }
    } catch (err) {
      setError(`JSON Parse Error: ${err.message}`);
      setLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/bfhl';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsedData }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`Failed to fetch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Hierarchy Processor API</h1>
        <p>SRM Full Stack Engineering Challenge</p>
      </header>

      <main className="dashboard-grid">
        {/* Left Column: Input */}
        <section className="input-section">
          <div className="glass-card">
            <h2><Layers size={24} /> Input Data</h2>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Enter a JSON array of node strings (e.g. <code>["A-&gt;B", "A-&gt;C"]</code>).
            </p>
            <form onSubmit={handleSubmit} className="input-group">
              <textarea 
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder='["A->B", "A->C"]'
              />
              <button type="submit" disabled={loading}>
                {loading ? (
                  <><div className="spinner"></div> Processing...</>
                ) : (
                  <><Send size={20} /> Process Nodes</>
                )}
              </button>
            </form>
            
            {error && (
              <div className="glass-card" style={{ marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5' }}>
                  <AlertCircle size={20} />
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Output */}
        <section className="output-section">
          {result ? (
            <div className="results animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* User Info & Summary */}
              <div className="glass-card">
                <h2><CheckCircle size={24} color="var(--success)" /> Success</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  <div className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>User: {result.user_id}</div>
                  <div className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>Email: {result.email_id}</div>
                  <div className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>Roll: {result.college_roll_number}</div>
                </div>

                <div className="summary-cards">
                  <div className="stat-card">
                    <div className="stat-value">{result.summary.total_trees}</div>
                    <div className="stat-label">Valid Trees</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{result.summary.total_cycles}</div>
                    <div className="stat-label">Cycles Found</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent)' }}>
                      {result.summary.largest_tree_root || '-'}
                    </div>
                    <div className="stat-label">Largest Root</div>
                  </div>
                </div>
              </div>

              {/* Invalid & Duplicates */}
              {(result.invalid_entries.length > 0 || result.duplicate_edges.length > 0) && (
                <div className="glass-card">
                  <h3>Warnings</h3>
                  {result.invalid_entries.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span className="badge badge-danger">Invalid Entries</span>
                      <div className="tag-list">
                        {result.invalid_entries.map((item, i) => <span key={i} className="tag">{item}</span>)}
                      </div>
                    </div>
                  )}
                  {result.duplicate_edges.length > 0 && (
                    <div>
                      <span className="badge badge-warning">Duplicate Edges</span>
                      <div className="tag-list">
                        {result.duplicate_edges.map((item, i) => <span key={i} className="tag">{item}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hierarchies */}
              <div className="glass-card">
                <h2>Hierarchies</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.hierarchies.map((h, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          Root: {h.root}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {h.has_cycle ? (
                            <span className="badge badge-danger"><RefreshCw size={14} style={{marginRight: '4px'}}/> Cyclic</span>
                          ) : (
                            <span className="badge" style={{ background: 'var(--primary)' }}>Depth: {h.depth}</span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ overflowX: 'auto', padding: '0.5rem' }}>
                        {h.has_cycle ? (
                          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Tree visualization disabled for cyclic structures.
                          </div>
                        ) : (
                          <TreeNode nodeName={h.root} nodeData={h.tree[h.root]} isRoot={true} />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {result.hierarchies.length === 0 && (
                    <p>No hierarchies generated from input.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              <div style={{ textAlign: 'center' }}>
                <Layers size={48} style={{ marginBottom: '1rem' }} />
                <h3>Awaiting Input</h3>
                <p>Submit node data to view the structured insights.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
