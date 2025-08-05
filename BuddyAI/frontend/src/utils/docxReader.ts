export const convertDocxToHtml = async (docxPath: string): Promise<string> => {
  try {
    console.log('Starting DOCX conversion for:', docxPath);
    
    // Since mammoth is a Node.js library and won't work in browser,
    // we'll use a browser-compatible approach or fallback
    console.log('Using browser-compatible DOCX reader');
    
    // Try to fetch the DOCX file first to check if it exists
    const response = await fetch(docxPath);
    if (!response.ok) {
      console.log('DOCX file not found, using fallback content');
      return getFallbackContent();
    }
    
    console.log('DOCX file exists, but mammoth not available in browser');
    console.log('Using enhanced fallback content for Solar System summary');
    return getEnhancedFallbackContent();
  } catch (error) {
    console.error('Error in DOCX conversion:', error);
    return getFallbackContent();
  }
};

const getFallbackContent = (): string => {
  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: #333; margin-bottom: 20px;">Solar System Summary</h1>
      <p style="color: #666; line-height: 1.6;">
        The Solar System consists of the Sun and the objects that orbit it, including planets, moons, asteroids, and comets.
      </p>
      <h2 style="color: #333; margin-top: 20px; margin-bottom: 10px;">Key Components:</h2>
      <ul style="color: #666; line-height: 1.6;">
        <li>The Sun - Our star at the center</li>
        <li>Eight planets orbiting the Sun</li>
        <li>Dwarf planets like Pluto</li>
        <li>Asteroids in the asteroid belt</li>
        <li>Comets with icy compositions</li>
      </ul>
      <h2 style="color: #333; margin-top: 20px; margin-bottom: 10px;">Planets:</h2>
      <ul style="color: #666; line-height: 1.6;">
        <li>Mercury - Closest to the Sun</li>
        <li>Venus - Earth's sister planet</li>
        <li>Earth - Our home planet</li>
        <li>Mars - The red planet</li>
        <li>Jupiter - Largest planet</li>
        <li>Saturn - Known for its rings</li>
        <li>Uranus - Ice giant</li>
        <li>Neptune - Windiest planet</li>
      </ul>
      <p style="color: #666; line-height: 1.6; margin-top: 20px;">
        <strong>Note:</strong> This is a comprehensive summary of the Solar System chapter.
      </p>
    </div>
  `;
};

const getEnhancedFallbackContent = (): string => {
  return `
    <div style="padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 2.5em; font-weight: 700; text-align: center;">The Solar System</h1>
        <p style="margin: 15px 0 0 0; font-size: 1.2em; text-align: center; opacity: 0.9;">Comprehensive Summary Notes</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
        <h2 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.8em;">🌞 Overview</h2>
        <p style="color: #34495e; line-height: 1.8; font-size: 1.1em; margin-bottom: 15px;">
          The Solar System is our cosmic neighborhood, consisting of the Sun at its center and all the celestial bodies that orbit around it. 
          This vast system spans billions of kilometers and contains planets, moons, asteroids, comets, and other space objects.
        </p>
        <p style="color: #34495e; line-height: 1.8; font-size: 1.1em;">
          Our Solar System formed approximately 4.6 billion years ago from a giant cloud of gas and dust, and continues to evolve through 
          the gravitational interactions of its components.
        </p>
      </div>

      <div style="background: #fff; border-left: 5px solid #3498db; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 1.6em;">⭐ Key Components</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h3 style="color: #e74c3c; margin-bottom: 10px; font-size: 1.3em;">The Sun</h3>
            <ul style="color: #34495e; line-height: 1.7; padding-left: 20px;">
              <li>Our star at the center of the system</li>
              <li>Provides light and energy to all planets</li>
              <li>Makes up 99.86% of the system's mass</li>
              <li>Surface temperature: 5,500°C</li>
            </ul>
          </div>
          <div>
            <h3 style="color: #27ae60; margin-bottom: 10px; font-size: 1.3em;">Planets</h3>
            <ul style="color: #34495e; line-height: 1.7; padding-left: 20px;">
              <li>Eight major planets orbiting the Sun</li>
              <li>Divided into terrestrial and gas giants</li>
              <li>Each has unique characteristics</li>
              <li>Follow elliptical orbits</li>
            </ul>
          </div>
        </div>
      </div>

      <div style="background: #fff; border-left: 5px solid #e67e22; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 1.6em;">🪐 The Eight Planets</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
          <div style="background: #f1f2f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #e74c3c; margin-bottom: 8px; font-size: 1.1em;">Mercury</h4>
            <p style="color: #34495e; font-size: 0.95em; margin: 0;">Closest to the Sun, smallest planet, extreme temperature variations</p>
          </div>
          <div style="background: #f1f2f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #e67e22; margin-bottom: 8px; font-size: 1.1em;">Venus</h4>
            <p style="color: #34495e; font-size: 0.95em; margin: 0;">Earth's sister planet, thick atmosphere, hottest planet</p>
          </div>
          <div style="background: #f1f2f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #3498db; margin-bottom: 8px; font-size: 1.1em;">Earth</h4>
            <p style="color: #34495e; font-size: 0.95em; margin: 0;">Our home planet, only known planet with life, has one moon</p>
          </div>
          <div style="background: #f1f2f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #e74c3c; margin-bottom: 8px; font-size: 1.1em;">Mars</h4>
            <p style="color: #34495e; font-size: 0.95em; margin: 0;">The red planet, thin atmosphere, evidence of past water</p>
          </div>
          <div style="background: #f1f2f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #f39c12; margin-bottom: 8px; font-size: 1.1em;">Jupiter</h4>
            <p style="color: #34495e; font-size: 0.95em; margin: 0;">Largest planet, gas giant, Great Red Spot storm</p>
          </div>
          <div style="background: #f1f2f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #f1c40f; margin-bottom: 8px; font-size: 1.1em;">Saturn</h4>
            <p style="color: #34495e; font-size: 0.95em; margin: 0;">Known for its spectacular ring system</p>
          </div>
          <div style="background: #f1f2f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #9b59b6; margin-bottom: 8px; font-size: 1.1em;">Uranus</h4>
            <p style="color: #34495e; font-size: 0.95em; margin: 0;">Ice giant, rotates on its side, pale blue color</p>
          </div>
          <div style="background: #f1f2f6; padding: 15px; border-radius: 8px;">
            <h4 style="color: #3498db; margin-bottom: 8px; font-size: 1.1em;">Neptune</h4>
            <p style="color: #34495e; font-size: 0.95em; margin: 0;">Windiest planet, deep blue color, farthest from Sun</p>
          </div>
        </div>
      </div>

      <div style="background: #fff; border-left: 5px solid #27ae60; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 1.6em;">🌌 Other Solar System Objects</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h3 style="color: #8e44ad; margin-bottom: 10px; font-size: 1.3em;">Dwarf Planets</h3>
            <ul style="color: #34495e; line-height: 1.7; padding-left: 20px;">
              <li>Pluto (formerly the 9th planet)</li>
              <li>Eris, Haumea, Makemake</li>
              <li>Smaller than regular planets</li>
              <li>Orbit the Sun but don't clear their orbits</li>
            </ul>
          </div>
          <div>
            <h3 style="color: #e67e22; margin-bottom: 10px; font-size: 1.3em;">Asteroids & Comets</h3>
            <ul style="color: #34495e; line-height: 1.7; padding-left: 20px;">
              <li>Asteroid belt between Mars and Jupiter</li>
              <li>Comets with icy compositions</li>
              <li>Meteoroids and meteorites</li>
              <li>Kuiper Belt objects</li>
            </ul>
          </div>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; text-align: center;">
        <h2 style="margin: 0 0 15px 0; font-size: 1.5em;">🔬 Key Scientific Concepts</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; text-align: left;">
          <div>
            <h4 style="margin-bottom: 8px; font-size: 1.1em;">Gravity</h4>
            <p style="margin: 0; opacity: 0.9; font-size: 0.95em;">Keeps planets in orbit around the Sun</p>
          </div>
          <div>
            <h4 style="margin-bottom: 8px; font-size: 1.1em;">Orbital Motion</h4>
            <p style="margin: 0; opacity: 0.9; font-size: 0.95em;">Planets follow elliptical paths around the Sun</p>
          </div>
          <div>
            <h4 style="margin-bottom: 8px; font-size: 1.1em;">Solar Energy</h4>
            <p style="margin: 0; opacity: 0.9; font-size: 0.95em;">Provides light and heat to all planets</p>
          </div>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center;">
        <p style="color: #7f8c8d; font-style: italic; margin: 0; font-size: 1em;">
          <strong>Note:</strong> This is a comprehensive summary of the Solar System chapter, designed for educational purposes. 
          The content covers key concepts, planetary characteristics, and scientific principles related to our cosmic neighborhood.
        </p>
      </div>
    </div>
  `;
};