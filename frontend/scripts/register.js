const { auth } = require("./auth");

// Envio do formulário de registro de cliente
const userRegisterClient = () => {
  document
    .getElementById("registerClientForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        alert("As senhas não coincidem");
        return;
      }

      try {
        await auth.register(
          {
            name: email.split("@")[0], // Usa parte do email como nome
            email,
            password,
          },
          "client"
        );
        window.location.href = "index.html";
      } catch (error) {
        alert(error.message);
      }
    });
};

// Envio do formulário de registro de modelo
const userRegisterModel = () => {
  document.getElementById("modelForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }

    // Coleta os serviços selecionados
    const services = Array.from(
      document.querySelectorAll('input[name="services"]:checked')
    ).map((cb) => cb.value);

    // Coleta as tags selecionadas
    const tags = Array.from(
      document.querySelectorAll('input[name="tags"]:checked')
    ).map((cb) => cb.value);

    const formData = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      password: password,
      age: document.getElementById("age").value,
      location: document.getElementById("location").value,
      bio: document.getElementById("bio").value,
      services: services,
      tags: tags,
      pricing: {
        "10min": document.getElementById("price10").value,
        "30min": document.getElementById("price30").value,
        "1hour": document.getElementById("price60").value,
        vip: document.getElementById("priceVIP").value,
      },
      type: "model",
    };

    try {
      await auth.register(formData, "model");
      window.location.href = "profile.html";
    } catch (error) {
      alert(error.message);
    }
  });
};

module.exports  = {
  userRegisterClient,
  userRegisterModel,
};
