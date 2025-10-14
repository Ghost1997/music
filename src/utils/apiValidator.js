export const validateApiConnection = async () => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/music';
    console.log('Validating API connection to:', apiUrl);
    
    const response = await fetch(`${apiUrl}/videos?limit=1`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('API validation response status:', response.status);
    const data = await response.json();
    console.log('API validation response data:', data);

    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error('API validation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
