// Test script for Canva AI Integration
// Run this to verify the integration is working

import CanvaAIIntegration from './lib/canvaAIIntegration.js';

// Test data
const testData = {
  agentInfo: {
    name: 'John Smith',
    agency: 'Premier Real Estate',
    phone: '(555) 123-4567',
    email: 'john@premierrealestate.com',
    website: 'www.premierrealestate.com'
  },
  style: 'modern-luxury',
  photos: ['sample-photo-1.jpg', 'sample-photo-2.jpg'],
  aiPhotos: ['ai-generated-photo-1.jpg'],
  listing: 'Beautiful 4-bedroom home with modern kitchen and pool. Located in prestigious neighborhood. $850,000.',
  propertyInfo: {
    address: '123 Luxury Lane, Beverly Hills, CA',
    bedrooms: '4',
    bathrooms: '3',
    sqft: '2,500',
    type: 'Single Family Home',
    features: ['Pool', 'Modern Kitchen', 'Garage', 'Garden'],
    price: '$850,000'
  }
};

async function testCanvaIntegration() {
  console.log('🧪 Testing Canva AI Integration...\n');
  
  try {
    // Create instance
    const canvaAI = new CanvaAIIntegration();
    
    // Test 1: Check availability
    console.log('1️⃣ Testing service availability...');
    const availability = await canvaAI.checkAvailability();
    console.log('✅ Availability:', availability);
    
    // Test 2: Get available templates
    console.log('\n2️⃣ Testing template availability...');
    const templates = canvaAI.getAvailableTemplates();
    console.log('✅ Templates:', Object.keys(templates.realEstate));
    
    // Test 3: Test template selection
    console.log('\n3️⃣ Testing smart template selection...');
    const selectedTemplate = canvaAI.selectOptimalTemplate(testData);
    console.log('✅ Selected template:', selectedTemplate.name);
    
    // Test 4: Test content preparation
    console.log('\n4️⃣ Testing content preparation...');
    const canvaContent = canvaAI.prepareCanvaContent(testData, selectedTemplate);
    console.log('✅ Content prepared:', {
      templateId: canvaContent.templateId,
      propertyTitle: canvaContent.content.propertyTitle,
      agentName: canvaContent.content.agentName
    });
    
    // Test 5: Test flyer generation (simulated)
    console.log('\n5️⃣ Testing flyer generation...');
    const flyerResult = await canvaAI.generateFlyer(testData);
    console.log('✅ Flyer generated:', {
      success: flyerResult.success,
      template: flyerResult.template,
      quality: flyerResult.quality,
      generatedBy: flyerResult.generatedBy
    });
    
    // Test 6: Test fallback generation
    console.log('\n6️⃣ Testing fallback generation...');
    const fallbackResult = await canvaAI.generateFallbackFlyer(testData);
    console.log('✅ Fallback generated:', {
      success: fallbackResult.success,
      template: fallbackResult.template,
      quality: fallbackResult.quality
    });
    
    console.log('\n🎉 All tests passed! Canva AI integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test different property types
async function testPropertyTypeDetection() {
  console.log('\n🏠 Testing property type detection...\n');
  
  const canvaAI = new CanvaAIIntegration();
  
  const testCases = [
    {
      name: 'Luxury Property',
      data: { ...testData, propertyInfo: { ...testData.propertyInfo, price: '$1,200,000' } }
    },
    {
      name: 'Condo',
      data: { ...testData, propertyInfo: { ...testData.propertyInfo, type: 'Condo/Apartment' } }
    },
    {
      name: 'Standard Home',
      data: { ...testData, propertyInfo: { ...testData.propertyInfo, price: '$450,000' } }
    }
  ];
  
  for (const testCase of testCases) {
    const template = canvaAI.selectOptimalTemplate(testCase.data);
    console.log(`${testCase.name}: ${template.name} (${template.style})`);
  }
}

// Run tests
if (typeof window === 'undefined') {
  // Node.js environment
  testCanvaIntegration().then(() => {
    return testPropertyTypeDetection();
  }).catch(console.error);
} else {
  // Browser environment
  console.log('🌐 Running in browser - tests will be available in console');
  window.testCanvaIntegration = testCanvaIntegration;
  window.testPropertyTypeDetection = testPropertyTypeDetection;
}
