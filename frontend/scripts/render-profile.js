const { auth } = require("./auth");

const createUserProfile = () => {
  // Dados mockados do perfil
  const mockProfile = {
    id: 1,
    name: "Ana Silva",
    age: 23,
    location: "São Paulo - SP",
    category: "Premium",
    photo:
      "https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    photos: [
      "https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    online: true,
    bio: "Olá! Sou a Ana, modelo premium na Live Confidente. Faço shows exclusivos e personalizados, sempre com muito carinho e atenção aos meus admiradores. Adoro interagir e criar momentos especiais com quem me assiste.",
    services: [
      "Live Privada",
      "Chat Exclusivo",
      "Vídeo Chamada",
      "Fotos Personalizadas",
      "Shows Temáticos",
      "Áudio Mensagens",
    ],
    pricing: [
      { duration: "10 minutos", price: 50 },
      { duration: "30 minutos", price: 120 },
      { duration: "1 hora", price: 200 },
      { duration: "Mensalidade VIP", price: 500 },
    ],
    reviews: [
      {
        id: 1,
        user: "João M.",
        rating: 5,
        date: "2023-10-15",
        comment:
          "Show incrível! A Ana é super carismática e faz um show maravilhoso.",
      },
      {
        id: 2,
        user: "Pedro S.",
        rating: 4,
        date: "2023-10-10",
        comment: "Ótima live privada, super atenciosa e profissional!",
      },
    ],
    availability: {
      monday: { start: "14:00", end: "02:00" },
      tuesday: { start: "14:00", end: "02:00" },
      wednesday: { start: "14:00", end: "02:00" },
      thursday: { start: "14:00", end: "02:00" },
      friday: { start: "14:00", end: "04:00" },
      saturday: { start: "16:00", end: "04:00" },
      sunday: { start: "16:00", end: "02:00" },
    },
    stats: {
      followers: 15000,
      totalShows: 450,
      showsThisWeek: 12,
      averageRating: 4.8,
    },
    nextShow: "2025-01-23T22:00:00",
    tags: ["Dança", "Cosplay", "ASMR", "Fetiche", "Shows Temáticos"],
  };

  // Função para carregar os dados do perfil
  function loadProfile(profile) {
    // Informações básicas
    document.getElementById("profilePhoto").src = profile.photo;
    document.getElementById("profilePhoto").alt = profile.name;
    document.getElementById("profileName").textContent = profile.name;
    document.getElementById("profileAge").textContent = `${profile.age} anos`;
    document.getElementById("profileLocation").textContent = profile.location;
    document.getElementById("profileCategory").textContent = profile.category;
    document.getElementById("profileRating").textContent = profile.rating;
    document.getElementById(
      "profileReviewCount"
    ).textContent = `(${profile.reviewCount} avaliações)`;
    document.getElementById("verifiedBadge").style.display = profile.verified
      ? "inline-flex"
      : "none";
    document.getElementById("profileBio").textContent = profile.bio;
    document.getElementById("btnChat").setAttribute("data-id", profile.id);

    // Status online
    const onlineStatus = document.querySelector(".online-status");
    onlineStatus.classList.toggle("online", profile.online);
    onlineStatus.textContent = profile.online ? "Online" : "Offline";

    // Estatísticas
    const statsSection = document.createElement("div");
    statsSection.className = "info-section";
    statsSection.innerHTML = `
          <h2>Estatísticas</h2>
          <div class="stats-grid">
              <div class="stat-item">
                  <span class="stat-value">${profile.stats.followers.toLocaleString()}</span>
                  <span class="stat-label">Seguidores</span>
              </div>
              <div class="stat-item">
                  <span class="stat-value">${profile.stats.totalShows}</span>
                  <span class="stat-label">Shows realizados</span>
              </div>
              <div class="stat-item">
                  <span class="stat-value">${profile.stats.showsThisWeek}</span>
                  <span class="stat-label">Shows esta semana</span>
              </div>
              <div class="stat-item">
                  <span class="stat-value">★ ${
                    profile.stats.averageRating
                  }</span>
                  <span class="stat-label">Avaliação média</span>
              </div>
          </div>
      `;
    document
      .querySelector("#about")
      .insertBefore(
        statsSection,
        document.querySelector("#about .info-section")
      );

    // Próximo show
    const nextShowDate = new Date(profile.nextShow);
    const nextShowSection = document.createElement("div");
    nextShowSection.className = "info-section next-show";
    nextShowSection.innerHTML = `
          <h2>Próximo Show</h2>
          <div class="next-show-info">
              <div class="show-time">
                  <span class="date">${nextShowDate.toLocaleDateString()}</span>
                  <span class="time">${nextShowDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</span>
              </div>
              <button class="btn btn-primary">Agendar Lembrete</button>
          </div>
      `;
    document
      .querySelector("#about")
      .insertBefore(
        nextShowSection,
        document.querySelector("#about .info-section")
      );

    // Tags
    const tagsSection = document.createElement("div");
    tagsSection.className = "info-section";
    tagsSection.innerHTML = `
          <h2>Especialidades</h2>
          <div class="tags-grid">
              ${profile.tags
                .map(
                  (tag) => `
                  <span class="tag">${tag}</span>
              `
                )
                .join("")}
          </div>
      `;
    document.querySelector("#about").appendChild(tagsSection);

    // Serviços
    const servicesGrid = document.getElementById("profileServices");
    servicesGrid.innerHTML = profile.services
      .map(
        (service) => `
          <div class="service-item">
              <span class="service-name">${service}</span>
          </div>
      `
      )
      .join("");

    // Preços
    const pricingTable = document.getElementById("profilePricing");
    pricingTable.innerHTML = profile.pricing
      .map(
        (item) => `
          <div class="price-item">
              <span class="duration">${item.duration}</span>
              <span class="price">R$ ${item.price}</span>
          </div>
      `
      )
      .join("");

    // Fotos
    const photoGrid = document.getElementById("profilePhotos");
    photoGrid.innerHTML = profile.photos
      .map(
        (photo) => `
          <div class="photo-item">
              <img src="${photo}" alt="${profile.name}">
          </div>
      `
      )
      .join("");

    // Avaliações
    const reviewsList = document.getElementById("profileReviews");
    reviewsList.innerHTML = profile.reviews
      .map(
        (review) => `
          <div class="review-item">
              <div class="review-header">
                  <span class="review-user">${review.user}</span>
                  <div class="review-rating">
                      <span class="stars">${"&#9733;".repeat(
                        review.rating
                      )}${"&#9734;".repeat(5 - review.rating)}</span>
                  </div>
                  <span class="review-date">${new Date(
                    review.date
                  ).toLocaleDateString()}</span>
              </div>
              <p class="review-comment">${review.comment}</p>
          </div>
      `
      )
      .join("");

    // Disponibilidade
    const calendarView = document.getElementById("profileCalendar");
    calendarView.innerHTML = Object.entries(profile.availability)
      .map(
        ([day, hours]) => `
          <div class="calendar-day">
              <span class="day-name">${
                day.charAt(0).toUpperCase() + day.slice(1)
              }</span>
              <span class="day-hours">${hours.start} - ${hours.end}</span>
          </div>
      `
      )
      .join("");
  }

  // Gerenciamento das tabs
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active de todos os botões e painéis
      document
        .querySelectorAll(".tab-button")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-pane")
        .forEach((p) => p.classList.remove("active"));

      // Adiciona active ao botão clicado e painel correspondente
      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });

  // Event listeners para botões de ação
  document.getElementById("liveButton").addEventListener("click", () => {
    if (!auth.currentUser) {
      window.location.href = "login.html";
      return;
    }
    alert("Entrando na live...");
  });

  document.getElementById("privateButton").addEventListener("click", () => {
    if (!auth.currentUser) {
      window.location.href = "login.html";
      return;
    }
    alert("Iniciando show privado...");
  });

  document.getElementById("followButton").addEventListener("click", () => {
    if (!auth.currentUser) {
      window.location.href = "login.html";
      return;
    }
    alert("Seguindo modelo...");
  });

  document.getElementById("tipButton").addEventListener("click", () => {
    if (!auth.currentUser) {
      window.location.href = "login.html";
      return;
    }
    alert("Enviando presente...");
  });

  // Carrega o perfil quando a página carregar
  document.addEventListener("DOMContentLoaded", () => {
    // Em produção, buscaríamos o ID da URL e faríamos uma chamada à API
    loadProfile(mockProfile);
  });
};

module.exports = { createUserProfile };
