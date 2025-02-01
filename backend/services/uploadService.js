const AWS = require('aws-sdk');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Configurar AWS SDK
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Tamanhos padrão para as imagens
const IMAGE_SIZES = {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 500, height: 500 },
    large: { width: 1024, height: 1024 }
};

// Tipos de imagem permitidos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

class UploadService {
    /**
     * Processa e faz upload de uma imagem para o S3
     * @param {Buffer} buffer - Buffer da imagem
     * @param {string} mimeType - Tipo MIME da imagem
     * @param {string} folder - Pasta no S3 (ex: 'profiles', 'verification')
     * @returns {Promise<Object>} URLs das diferentes versões da imagem
     */
    async uploadImage(buffer, mimeType, folder) {
        try {
            // Validar tipo de arquivo
            if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
                throw new Error('Tipo de arquivo não permitido');
            }

            const imageId = uuidv4();
            const urls = {};

            // Processar e fazer upload de cada tamanho
            for (const [size, dimensions] of Object.entries(IMAGE_SIZES)) {
                const processedImage = await sharp(buffer)
                    .resize(dimensions.width, dimensions.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .toFormat('webp', { quality: 80 })
                    .toBuffer();

                const key = `${folder}/${imageId}-${size}.webp`;
                
                await s3.upload({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key,
                    Body: processedImage,
                    ContentType: 'image/webp',
                    ACL: 'public-read'
                }).promise();

                urls[size] = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            }

            // Upload da imagem original
            const originalKey = `${folder}/${imageId}-original`;
            await s3.upload({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: originalKey,
                Body: buffer,
                ContentType: mimeType,
                ACL: 'public-read'
            }).promise();

            urls.original = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${originalKey}`;

            return urls;
        } catch (error) {
            console.error('Erro no upload:', error);
            throw new Error('Falha ao processar upload da imagem');
        }
    }

    /**
     * Remove uma imagem e suas variações do S3
     * @param {string} imageUrl - URL da imagem a ser removida
     */
    async deleteImage(imageUrl) {
        try {
            // Extrair o ID da imagem da URL
            const urlParts = imageUrl.split('/');
            const filename = urlParts[urlParts.length - 1];
            const imageId = filename.split('-')[0];
            const folder = urlParts[urlParts.length - 2];

            // Listar todos os objetos com o mesmo ID
            const listParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Prefix: `${folder}/${imageId}`
            };

            const listedObjects = await s3.listObjectsV2(listParams).promise();

            if (listedObjects.Contents.length === 0) return;

            // Criar array de objetos para deletar
            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Delete: { Objects: [] }
            };

            listedObjects.Contents.forEach(({ Key }) => {
                deleteParams.Delete.Objects.push({ Key });
            });

            // Deletar todos os objetos
            await s3.deleteObjects(deleteParams).promise();
        } catch (error) {
            console.error('Erro ao deletar imagem:', error);
            throw new Error('Falha ao remover imagem');
        }
    }

    /**
     * Verifica se uma imagem existe no S3
     * @param {string} imageUrl - URL da imagem
     * @returns {Promise<boolean>}
     */
    async imageExists(imageUrl) {
        try {
            const urlParts = imageUrl.split('/');
            const key = urlParts.slice(3).join('/');

            await s3.headObject({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key
            }).promise();

            return true;
        } catch (error) {
            if (error.code === 'NotFound') {
                return false;
            }
            throw error;
        }
    }
}

module.exports = new UploadService();
