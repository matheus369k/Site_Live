const AWS = require('aws-sdk');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class S3Service {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });
        this.bucket = process.env.AWS_S3_BUCKET;
    }

    // Gera nome único para o arquivo
    generateFileName(originalName) {
        const extension = originalName.split('.').pop();
        return `${uuidv4()}.${extension}`;
    }

    // Processa e otimiza a imagem
    async processImage(buffer, width = 800) {
        return sharp(buffer)
            .resize(width, null, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toBuffer();
    }

    // Gera thumbnail da imagem
    async generateThumbnail(buffer) {
        return sharp(buffer)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 70 })
            .toBuffer();
    }

    // Upload de imagem para S3
    async uploadImage(file, folder = 'photos') {
        try {
            const fileName = this.generateFileName(file.originalname);
            
            // Processa imagem original
            const processedBuffer = await this.processImage(file.buffer);
            const mainKey = `${folder}/${fileName}`;
            
            // Upload da imagem principal
            await this.s3.upload({
                Bucket: this.bucket,
                Key: mainKey,
                Body: processedBuffer,
                ContentType: file.mimetype,
                ACL: 'public-read'
            }).promise();

            // Gera e faz upload do thumbnail
            const thumbnailBuffer = await this.generateThumbnail(file.buffer);
            const thumbnailKey = `${folder}/thumbnails/${fileName}`;
            
            await this.s3.upload({
                Bucket: this.bucket,
                Key: thumbnailKey,
                Body: thumbnailBuffer,
                ContentType: file.mimetype,
                ACL: 'public-read'
            }).promise();

            return {
                url: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${mainKey}`,
                thumbnail: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`
            };
        } catch (error) {
            throw new Error(`Erro no upload da imagem: ${error.message}`);
        }
    }

    // Remove imagem do S3
    async deleteImage(url) {
        try {
            const key = url.split('.com/')[1];
            
            // Remove imagem principal
            await this.s3.deleteObject({
                Bucket: this.bucket,
                Key: key
            }).promise();

            // Remove thumbnail
            const thumbnailKey = key.replace('photos/', 'photos/thumbnails/');
            await this.s3.deleteObject({
                Bucket: this.bucket,
                Key: thumbnailKey
            }).promise();

        } catch (error) {
            throw new Error(`Erro ao deletar imagem: ${error.message}`);
        }
    }

    // Lista todas as imagens de uma pasta
    async listImages(folder = 'photos') {
        try {
            const response = await this.s3.listObjectsV2({
                Bucket: this.bucket,
                Prefix: folder
            }).promise();

            return response.Contents.map(item => ({
                key: item.Key,
                url: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`
            }));
        } catch (error) {
            throw new Error(`Erro ao listar imagens: ${error.message}`);
        }
    }
}

module.exports = new S3Service();
