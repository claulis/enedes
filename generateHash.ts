import * as bcrypt from 'bcrypt';

const password = process.argv[2]; // Recebe a senha como argumento da linha de comando
const saltRounds = 10;

if (!password) {
    console.error('Por favor, forneça uma senha como argumento.');
    process.exit(1);
}

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Erro ao gerar hash:', err);
        process.exit(1);
    }
    console.log('Hash gerado:', hash);
});