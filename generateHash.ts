import bcrypt from 'bcrypt';

async function generateHash(password: string) {
    const hash = await bcrypt.hash(password, 10);
    console.log(hash);
}

generateHash('123456');