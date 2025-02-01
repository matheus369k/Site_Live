const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configuração do cliente S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'sa-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    } : undefined
});

// Upload de arquivo para o S3
exports.uploadToS3 = async (fileBuffer, key) => {
    try {
        if (!process.env.AWS_BUCKET_NAME) {
            throw new Error('AWS_BUCKET_NAME não configurado');
        }

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ACL: 'public-read'
        };

        await s3Client.send(new PutObjectCommand(params));
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'sa-east-1'}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('Erro ao fazer upload para S3:', error);
        throw error;
    }
};

// Deletar arquivo do S3
exports.deleteFromS3 = async (key) => {
    try {
        if (!process.env.AWS_BUCKET_NAME) {
            throw new Error('AWS_BUCKET_NAME não configurado');
        }

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        };

        await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
        console.error('Erro ao deletar arquivo do S3:', error);
        throw error;
    }
};
