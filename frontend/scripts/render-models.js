const createModelsCards = () => {
  // Dados mockados para desenvolvimento
  const mockProfileModels = [
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

  // Função para renderizar os cards dos modelos
  function renderModelCards(models) {
    const grid = document.getElementById("modelsGrid");
    if (!grid) return;

    grid.innerHTML = models
      .map(
        (model) => `
        <div class="model-card">
            <div class="model-photo-container">
                <img class="model-photo" src="${model.photo}" alt="${
          model.name
        }">
                <div class="model-status">
                ${
                  model.online
                    ? '<p class="online-badge">Online</p>'
                    : '<p class="offline-badge">Offline</p>'
                }
                ${
                  model.verified
                    ? '<span class="verified-badge"> <img class="verified-icon" title="verificada" src="./assets/icons/shield-checkmark.svg" alt="verificada" /> Verificada<span>'
                    : ""
                }
                 </div>
            </div>
            <div class="model-info">
                <div class="model-guys">
                  <h3 class="model-name">${model.name}, ${model.age}</h3>
                  <p class="model-location">${model.location}</p>
                </div>

                <div>
                  <div class="model-hire">
                    <div class="model-rating">
                      <span class="rating-value">${model.rating}</span>
                      <span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                    </div>
                    <div class="model-price">
                        R$ ${model.price}/hora
                    </div>
                  </div>

                  <div class="model-buttons">
                    <button class="btn btn-chat" data-id=${model.id} >
                      <i class="fas fa-comments"></i>
                    </button>
                    <a href="profile.html?id=${
                      model.id
                    }" class="btn btn-primary model-btn">
                      Ver perfil
                    </a>
                  </div>
                </div>
            </div>
        </div>
    `
      )
      .join("");
  }

  // Função para filtrar modelos
  function filterModels(query = "", city = "") {
    let filtered = [...mockProfileModels];

    if (query) {
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(query.toLowerCase()) ||
          model.location.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (city) {
      filtered = filtered.filter(
        (model) => model.location.toLowerCase() === city.toLowerCase()
      );
    }

    return filtered;
  }

  // Event listeners
  document.addEventListener("DOMContentLoaded", () => {
    // Renderiza todos os modelos inicialmente
    renderModelCards(mockProfileModels);

    // Adiciona event listener para o campo de busca
    const searchInput = document.getElementById("searchInput");
    const cityFilter = document.getElementById("cityFilter");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const filtered = filterModels(e.target.value, cityFilter?.value);
        renderModelCards(filtered);
      });
    }

    if (cityFilter) {
      cityFilter.addEventListener("change", (e) => {
        const filtered = filterModels(searchInput?.value, e.target.value);
        renderModelCards(filtered);
      });
    }

    // Event listeners para as tags de filtro
    const filterTags = document.querySelectorAll(".filter-tag");
    filterTags.forEach((tag) => {
      tag.addEventListener("click", () => {
        filterTags.forEach((t) => t.classList.remove("active"));
        tag.classList.add("active");

        let filtered = [...mockProfileModels];
        const filter = tag.textContent.toLowerCase();

        switch (filter) {
          case "novos":
            filtered.sort((a, b) => b.id - a.id);
            break;
          case "verificados":
            filtered = filtered.filter((model) => model.verified);
            break;
          case "vip":
            filtered = filtered.filter((model) => model.category === "vip");
            break;
          case "online":
            filtered = filtered.filter((model) => model.online);
            break;
        }

        renderModelCards(filtered);
      });
    });
  });
};

module.exports = {
  createModelsCards,
};
