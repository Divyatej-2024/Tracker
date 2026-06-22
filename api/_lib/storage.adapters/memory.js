const memory = {
  logs: [],
  applications: [],
  documents: []
};

module.exports = {
  async getLogs() {
    return memory.logs.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  async addLog(input) {
    const now = new Date().toISOString();
    const log = Object.assign({ id: `${now}-${Math.random().toString(36).slice(2,8)}`, createdAt: now }, input);
    memory.logs.push(log);
    return log;
  },
  async getApplications() { return memory.applications.slice(); },
  async addApplication(input) {
    const now = new Date().toISOString();
    const app = Object.assign({ id: `${now}-${Math.random().toString(36).slice(2,8)}`, createdAt: now }, input);
    memory.applications.push(app);
    return app;
  },
  async updateApplication(id, updates){
    const idx = memory.applications.findIndex(a=>a.id===id);
    if(idx===-1) throw new Error('Not found');
    memory.applications[idx]=Object.assign({}, memory.applications[idx], updates);
    return memory.applications[idx];
  },
  async deleteApplication(id){ memory.applications = memory.applications.filter(a=>a.id!==id); return true; },
  async getDocuments(){ return memory.documents.slice(); },
  async addDocument(doc){ const now=new Date().toISOString(); const d=Object.assign({id:`${now}-${Math.random().toString(36).slice(2,8)}`, createdAt: now}, doc); memory.documents.push(d); return d; },
  async deleteDocument(id){ memory.documents = memory.documents.filter(d=>d.id!==id); return true; },
  async getDocumentFile(){ return null; }
};
