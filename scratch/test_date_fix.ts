const startDateStr = '2026-05-03';
const endDateStr = '2026-06-02';

const start1 = new Date(startDateStr);
start1.setHours(0, 0, 0, 0);
const end1 = new Date(endDateStr);
end1.setHours(23, 59, 59, 999);

console.log('Without slash replacement:');
console.log('start:', start1.toISOString());
console.log('end:', end1.toISOString());

const start2 = new Date(startDateStr.replace(/-/g, '/'));
start2.setHours(0, 0, 0, 0);
const end2 = new Date(endDateStr.replace(/-/g, '/'));
end2.setHours(23, 59, 59, 999);

console.log('\nWith slash replacement:');
console.log('start:', start2.toISOString());
console.log('end:', end2.toISOString());
