const auth = {
  currentUser: null,

  async init() {
    // Simula verificação de usuário logado
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.updateUI();
    }

    // Adiciona listener para o botão de logout
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
      logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.signOut();
      });
    }
  },

  updateUI() {
    const authButtons = document.getElementById("authButtons");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");

    if (this.currentUser) {
      if (authButtons) authButtons.style.display = "none";
      if (userMenu) {
        userMenu.style.display = "block";
        userName.textContent = this.currentUser.name || this.currentUser.email;
      }
    } else {
      if (authButtons) authButtons.style.display = "flex";
      if (userMenu) userMenu.style.display = "none";
    }
  },

  async signIn(email, password) {
    // autenticação de usuário
    if (email && password) {
      const response = await fetch(`${process.env.BACK_END_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const responseData = await response.json();

      if (responseData.status === "error") {
        throw new Error(`Error: ${responseData.message}`);
      }

      //const user = {
      //  email: email,
      // name: email.split("@")[0], // Usa parte do email como nome
      //  type: "client", // Por padrão, considera como cliente
      //};

      localStorage.setItem("user", JSON.stringify(responseData.user));
      localStorage.setItem("token", JSON.stringify(responseData.token));
      this.currentUser = responseData.user;
      this.updateUI();
      return true;
    }

    throw new Error("Email e senha são obrigatórios");
  },

  async register(data, type) {
    // registro de usuário
    const response = await fetch(`${process.env.BACK_END_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        role: type,
      }),
    });
    const responseData = await response.json();

    if (responseData.status === "error") {
      throw new Error(`Error: ${responseData.message}`);
    }

    localStorage.setItem("user", JSON.stringify(responseData.user));
    localStorage.setItem("token", JSON.stringify(responseData.token));
    this.currentUser = responseData.user;
    this.updateUI();
    return true;
  },

  signOut() {
    localStorage.removeItem("user");
    this.currentUser = null;
    this.updateUI();
    window.location.href = "index.html";
  },
};

// Inicializa o auth quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  auth.init();
});

module.exports = {
  auth,
};
