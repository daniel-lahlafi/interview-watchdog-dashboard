// Utility to generate placeholder images for the tutorial
export const generatePlaceholderImage = (width: number, height: number, text: string, color: string = 'blue') => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `#${color === 'blue' ? '667eea' : 'f093fb'}`);
  gradient.addColorStop(1, `#${color === 'blue' ? '764ba2' : 'f5576c'}`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  return canvas.toDataURL();
};

export const tutorialImages = [
  {
    id: 1,
    title: 'Dashboard Overview',
    description: 'Main dashboard with analytics and monitoring tools'
  },
  {
    id: 2,
    title: 'Create Interview',
    description: 'Interview setup and configuration interface'
  },
  {
    id: 3,
    title: 'Live Monitoring',
    description: 'Real-time interview monitoring and analytics'
  },
  {
    id: 4,
    title: 'Reports & Analytics',
    description: 'Detailed reports and performance analytics'
  }
]; 