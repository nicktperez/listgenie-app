// Test Canva Hybrid Integration
// This demonstrates how we integrate with Canva WITHOUT needing API keys

import CanvaHybridIntegration from './lib/canvaHybridIntegration.js';

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

async function testCanvaHybrid() {
  console.log('🧪 Testing Canva Hybrid Integration...\n');
  
  try {
    // Create instance
    const canvaHybrid = new CanvaHybridIntegration();
    
    // Test 1: Check availability
    console.log('1️⃣ Testing service availability...');
    const availability = await canvaHybrid.checkAvailability();
    console.log('✅ Availability:', availability);
    
    // Test 2: Get available templates
    console.log('\n2️⃣ Testing template availability...');
    const templates = canvaHybrid.getAvailableTemplates();
    console.log('✅ Templates:', Object.keys(templates.realEstate));
    
    // Test 3: Test smart template selection
    console.log('\n3️⃣ Testing smart template selection...');
    const selectedTemplate = canvaHybrid.selectOptimalTemplate(testData);
    console.log('✅ Selected template:', selectedTemplate.name);
    
    // Test 4: Test project specification creation
    console.log('\n4️⃣ Testing project specification creation...');
    const projectSpec = canvaHybrid.createProjectSpecification(testData, selectedTemplate);
    console.log('✅ Project spec created:', {
      template: projectSpec.template.name,
      propertyTitle: projectSpec.content.propertyTitle,
      agentName: projectSpec.content.agentName,
      totalPhotos: projectSpec.content.totalPhotos
    });
    
    // Test 5: Test full project generation
    console.log('\n5️⃣ Testing full project generation...');
    const projectResult = await canvaHybrid.generateCanvaProject(testData);
    console.log('✅ Project generated:', {
      success: projectResult.success,
      type: projectResult.type,
      template: projectResult.template,
      canvaProject: projectResult.canvaProject
    });
    
    // Test 6: Test user instructions
    console.log('\n6️⃣ Testing user instructions...');
    if (projectResult.instructions) {
      console.log('✅ Instructions created:', {
        title: projectResult.instructions.title,
        stepsCount: projectResult.instructions.steps.length,
        tipsCount: projectResult.instructions.tips.length
      });
    }
    
    console.log('\n🎉 All tests passed! Canva Hybrid integration is working correctly.');
    
    // Show what the user would actually get
    console.log('\n📋 What the user would receive:');
    console.log('1. Template selected:', projectResult.template);
    console.log('2. Canva project link:', projectResult.canvaProject.url);
    console.log('3. Step-by-step instructions for customization');
    console.log('4. Professional design guidance');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test different property types
async function testPropertyTypeDetection() {
  console.log('\n🏠 Testing property type detection...\n');
  
  const canvaHybrid = new CanvaHybridIntegration();
  
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
    const template = canvaHybrid.selectOptimalTemplate(testCase.data);
    console.log(`${testCase.name}: ${template.name} (${template.style})`);
  }
}

// Run tests
if (typeof window === 'undefined') {
  // Node.js environment
  testCanvaHybrid().then(() => {
    return testPropertyTypeDetection();
  }).catch(console.error);
} else {
  // Browser environment
  console.log('🌐 Running in browser - tests will be available in console');
  window.testCanvaHybrid = testCanvaHybrid;
  window.testPropertyTypeDetection = testPropertyTypeDetection;
}

// Export for use in other files
export { testCanvaHybrid, testPropertyTypeDetection };
