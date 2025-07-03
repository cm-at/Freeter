// Test file to check CSS module exports
const styles = require('./src/renderer/ui/components/app/app.module.scss');
console.log('CSS Module exports:', styles);
console.log('Type:', typeof styles);
console.log('Keys:', Object.keys(styles));