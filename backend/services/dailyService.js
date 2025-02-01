const axios = require('axios');

class DailyService {
    constructor() {
        this.api = axios.create({
            baseURL: 'https://api.daily.co/v1',
            headers: {
                'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    }

    // Criar uma nova sala
    async createRoom(modelId, clientId, durationMinutes = 60) {
        try {
            const response = await this.api.post('/rooms', {
                properties: {
                    exp: Math.round(Date.now() / 1000) + (durationMinutes * 60), // Expira após a duração
                    max_participants: 2, // Apenas modelo e cliente
                    enable_chat: true,
                    enable_recording: false, // Desabilita gravação por segurança
                    start_audio_off: false,
                    start_video_off: false,
                    lang: 'pt',
                    enable_knocking: true, // Permite que a modelo aprove a entrada
                    enable_prejoin_ui: true,
                    enable_network_ui: true,
                    enable_screenshare: false,
                    owner_only_broadcast: false,
                    eject_at_room_exp: true,
                    enable_advanced_chat: false
                },
                privacy: 'private',
                name: `${modelId}-${clientId}-${Date.now()}` // Nome único para a sala
            });

            return response.data;
        } catch (error) {
            throw new Error(`Erro ao criar sala: ${error.message}`);
        }
    }

    // Criar token de acesso para a sala
    async createMeetingToken(roomName, isModel = false) {
        try {
            const response = await this.api.post('/meeting-tokens', {
                properties: {
                    room_name: roomName,
                    is_owner: isModel, // Modelo tem controles de proprietário
                    enable_recording: false,
                    start_audio_off: false,
                    start_video_off: false,
                    enable_screenshare: false,
                    user_name: isModel ? 'Modelo' : 'Cliente',
                    enable_advanced_chat: false,
                    exp: Math.round(Date.now() / 1000) + (60 * 60) // Token expira em 1 hora
                }
            });

            return response.data.token;
        } catch (error) {
            throw new Error(`Erro ao criar token: ${error.message}`);
        }
    }

    // Encerrar uma sala
    async endRoom(roomName) {
        try {
            await this.api.delete(`/rooms/${roomName}`);
            return true;
        } catch (error) {
            throw new Error(`Erro ao encerrar sala: ${error.message}`);
        }
    }

    // Obter informações da sala
    async getRoomInfo(roomName) {
        try {
            const response = await this.api.get(`/rooms/${roomName}`);
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao obter informações da sala: ${error.message}`);
        }
    }

    // Atualizar configurações da sala
    async updateRoom(roomName, config) {
        try {
            const response = await this.api.post(`/rooms/${roomName}`, {
                properties: config
            });
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao atualizar sala: ${error.message}`);
        }
    }

    // Verificar se uma sala está ativa
    async isRoomActive(roomName) {
        try {
            const response = await this.api.get(`/meetings/${roomName}`);
            return response.data.total_participants > 0;
        } catch (error) {
            return false; // Se der erro, assumimos que a sala não está ativa
        }
    }

    // Remover participante da sala
    async removeParticipant(roomName, participantId) {
        try {
            await this.api.post(`/meetings/${roomName}/participants/${participantId}/leave`);
            return true;
        } catch (error) {
            throw new Error(`Erro ao remover participante: ${error.message}`);
        }
    }
}

module.exports = new DailyService();
