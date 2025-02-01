const createChatDisplay = () => {
  // Dados mockados para desenvolvimento
  const mockChatModels = [
    {
      id: 1,
      name: "Ana Silva",
      age: 23,
      location: "São Paulo - SP",
      category: "premium",
      photo:
        "https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      rating: 4.8,
      verified: true,
      online: true,
      price: 300,
    },
    {
      id: 2,
      name: "Julia Santos",
      age: 25,
      location: "Rio de Janeiro - RJ",
      category: "vip",
      photo:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1376&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      rating: 4.9,
      verified: true,
      online: false,
      price: 500,
    },
    {
      id: 3,
      name: "Carla Oliveira",
      age: 22,
      location: "Brasília - DF",
      category: "standard",
      photo:
        "https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      rating: 4.7,
      verified: false,
      online: true,
      price: 200,
    },
    {
      id: 4,
      name: "Mariana Costa",
      age: 24,
      location: "Salvador - BA",
      category: "premium",
      photo:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1376&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      rating: 4.6,
      verified: true,
      online: true,
      price: 350,
    },
    {
      id: 5,
      name: "Beatriz Lima",
      age: 26,
      location: "Belo Horizonte - MG",
      category: "vip",
      photo:
        "https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      rating: 4.9,
      verified: true,
      online: false,
      price: 450,
    },
    {
      id: 6,
      name: "Fernanda Martins",
      age: 23,
      location: "Curitiba - PR",
      category: "premium",
      photo:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1376&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      rating: 4.8,
      verified: true,
      online: true,
      price: 300,
    },
  ];

  // Render chat
  function renderChat(profiles) {
    document.querySelectorAll("[data-id]").forEach((btnChat) => {
      btnChat.addEventListener("click", (event) => {
        const profileId =
          event.target.dataset.id || event.target.parentElement.dataset.id;

        const chatProfile = profiles.find(
          (profile) => profile.id === parseInt(profileId)
        );

        document.getElementById("profilePhotoChat").src = chatProfile.photo;
        document.getElementById("profileNameChat").textContent =
          chatProfile.name;

        document.getElementById("chatContainer").classList.add("active");
      });
    });

    document.getElementById("chatClose").addEventListener("click", () => {
      document.getElementById("chatContainer").classList.remove("active");
    });
  }

  function addMessage(message, isSent = true) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message message-${isSent ? "sent" : "received"}`;
    messageDiv.textContent = message;
    document.getElementById("chatMessages").appendChild(messageDiv);
    document.getElementById("chatMessages").scrollTop =
      document.getElementById("chatMessages").scrollHeight;
  }

  document.getElementById("sendMessage").addEventListener("click", () => {
    const message = document.getElementById("messageInput").value.trim();
    if (message) {
      addMessage(message);
      document.getElementById("messageInput").value = "";

      // Simula resposta após 1 segundo
      setTimeout(() => {
        addMessage("Obrigada pela mensagem! Respondo em breve.", false);
      }, 1000);
    }
  });

  document.getElementById("messageInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("sendMessage").click();
    }
  });

  // Carrega o perfil quando a página carregar
  document.addEventListener("DOMContentLoaded", () => {
    // Em produção, buscaríamos o ID da URL e faríamos uma chamada à API
    renderChat(mockChatModels);
  });
};

module.exports  = {
  createChatDisplay,
};
