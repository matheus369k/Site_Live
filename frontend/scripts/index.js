const { createModelsCards } = require("./render-models.js");
const { createChatDisplay } = require("./render-chat.js");
const { userLogin } = require("./login.js");
const { userRegisterClient, userRegisterModel } = require("./register.js");
const { createUserProfile } = require("./render-profile.js");

switch (window.location.pathname) {
  case "/index.html":
    createModelsCards();
    createChatDisplay();
    break;
  case "/login.html":
    userLogin();
    break;
  case "/register-client.html":
    userRegisterClient();
    break;
  case "/register-model.html":
    userRegisterModel();
    break;
  case "/profile.html":
    createUserProfile();
    createChatDisplay();
    break;
  default:
    createModelsCards();
    createChatDisplay();
    break;
}
