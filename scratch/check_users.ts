import { businessRules } from '../src/lib/businessRules';

async function main() {
  const users = [
    { name: 'Luana Lisboa', id: '7198e546-a672-45a1-a2a4-93408810234b' },
    { name: 'Jose Lisboa', id: '113e6833-044d-49dc-bf12-42fe415877a1' },
    { name: 'Rita Lisboa', id: 'e7ae9737-2343-47a6-80c7-8e88d7eee8f0' },
    { name: 'Emerson Mines Antunes', id: 'a00a6bab-5720-4632-a0db-3604b3a9e258' }
  ];

  for (const u of users) {
    const data = await businessRules.getSeguradoData(u.id);
    console.log(`\n=== ${u.name} ===`);
    console.log('isSegurado:', data?.isSegurado);
    console.log('numero_certificado:', data?.apolice?.numero_certificado);
    console.log('numerosDaSorte:', data?.numerosDaSorte);
  }
}

main().catch(console.error);
