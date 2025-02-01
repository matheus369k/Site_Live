const { auth } = require("./auth");

// Envia dados do login para o servidor
const userLogin = () => {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await auth.signIn(email, password);
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message);
    }
  });
};

module.exports = {
  userLogin,
};
