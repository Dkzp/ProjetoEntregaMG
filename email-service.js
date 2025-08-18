// Carrega as variáveis de ambiente
require('dotenv').config();
// AQUI ESTÁ A CORREÇÃO: troquei 'a' por 'require'
const nodemailer = require('nodemailer');

// 1. Configura o "transporter", o serviço que vai enviar os e-mails
//    Estou usando o Gmail como exemplo, que é o mais comum.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, // O seu email do arquivo .env
        pass: process.env.EMAIL_KEY // A sua senha de app do arquivo .env
    }
});

/**
 * Função para enviar o e-mail do formulário de contato.
 * @param {string} name - Nome do remetente
 * @param {string} email - Email do remetente
 * @param {string} phone - Telefone (opcional) do remetente
 * @param {string} subject - Assunto da mensagem
 * @param {string} message - A mensagem do remetente
 */
async function sendContactEmail({ name, email, phone, subject, message }) {
    // 2. Define o conteúdo do e-mail
    const mailOptions = {
        from: `"${name}" <${process.env.EMAIL}>`, // Mostra o nome do remetente, mas envia pelo seu email
        to: process.env.EMAIL, // O e-mail de destino (o seu próprio e-mail)
        replyTo: email, // Permite que você clique em "Responder" e responda diretamente para o cliente
        subject: `Contato Fryday's - ${subject}`, // Assunto com o filtro solicitado
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #c0392b;">Nova Mensagem do Formulário de Contato Fryday's</h2>
                <p>Você recebeu uma nova mensagem através do site.</p>
                <hr>
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
                <p><strong>Assunto:</strong> ${subject}</p>
                <h3 style="margin-top: 20px;">Mensagem:</h3>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; border-left: 4px solid #c0392b;">
                    <p style="margin: 0;">${message.replace(/\n/g, '<br>')}</p>
                </div>
                <hr>
                <p style="font-size: 0.9em; color: #777;">E-mail enviado automaticamente pelo site Fryday's.</p>
            </div>
        `
    };

    // 3. Tenta enviar o e-mail
    try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail de contato enviado com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar o e-mail de contato:', error);
        // Lança o erro para que a rota no server.js possa capturá-lo
        throw new Error('Falha ao enviar o e-mail.');
    }
}

// Exporta a função para que possa ser usada no server.js
module.exports = { sendContactEmail };