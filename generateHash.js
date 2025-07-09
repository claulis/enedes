"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bcrypt = require("bcrypt");
var password = process.argv[2]; // Recebe a senha como argumento da linha de comando
var saltRounds = 10;
if (!password) {
    console.error('Por favor, forneça uma senha como argumento.');
    process.exit(1);
}
bcrypt.hash(password, saltRounds, function (err, hash) {
    if (err) {
        console.error('Erro ao gerar hash:', err);
        process.exit(1);
    }
    console.log('Hash gerado:', hash);
});
