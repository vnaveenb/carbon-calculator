let users = [];
let searchHistory = [];
let nextId = 1;

function findByUsername(username) {
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

function findByEmail(email) {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function findById(id) {
  return users.find(u => u.id === id) || null;
}

function createUser({ username, email, passwordHash, role }) {
  const user = { id: nextId++, username, email, passwordHash, role };
  users.push(user);
  return user;
}

function updateRole(userId, role) {
  const user = findById(Number(userId));
  if (user) user.role = role;
  return user;
}

function deleteUser(userId) {
  const idx = users.findIndex(u => u.id === Number(userId));
  if (idx >= 0) {
    users.splice(idx, 1);
    return true;
  }
  return false;
}

function getAllUsers() {
  return users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role }));
}

function addSearchHistory(entry) {
  searchHistory.push(entry);
}

function getHistoryForUser(userId) {
  return searchHistory.filter(s => s.user_id === userId);
}

module.exports = {
  findByUsername,
  findByEmail,
  findById,
  createUser,
  updateRole,
  deleteUser,
  getAllUsers,
  addSearchHistory,
  getHistoryForUser,
};
