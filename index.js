import * as Carousel from './Carousel.js';
import axios from 'axios';

const body = document.body;
// The breed selection input element.
const breedSelect = document.getElementById('breedSelect');
// The information section div element.
const infoDump = document.getElementById('infoDump');
// The progress bar div element.
const progressBar = document.getElementById('progressBar');
// The get favourites button element.
const getFavouritesBtn = document.getElementById('getFavouritesBtn');

const API_KEY = process.env.API_KEY;
console.log('API_KEY:', process.env.API_KEY);

axios.defaults.baseURL = 'https://api.thecatapi.com/v1';
axios.defaults.headers.common['x-api-key'] = API_KEY;

axios.interceptors.request.use((request) => {
  request.metadata = request.metadata || {};
  request.metadata.startTime = new Date().getTime();
  progressBar.style.width = '0%';
  body.style.cursor = 'progress';
  return request;
});

axios.interceptors.response.use(
  (response) => {
    response.config.metadata.endTime = new Date().getTime();
    response.durationInMS = response.config.metadata.endTime - response.config.metadata.startTime;
    body.style.cursor = 'default';
    return response;
  },
  (error) => {
    error.config.metadata.endTime = new Date().getTime();
    error.durationInMS = error.config.metadata.endTime - error.config.metadata.startTime;
    body.style.cursor = 'default';
    throw error;
  }
);

function updateProgress(progressEvent) {
  const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
  progressBar.style.width = `${percentage}%`;
}

async function initialLoad() {
  try {
    const { data: initialData, durationInMS } = await axios.get('/breeds', {
      onDownloadProgress: updateProgress,
    });
    if (!initialData) {
      throw new Error('No data was returned from the API');
    }
    console.log(`Initial load request duration: ${durationInMS}ms`);
    initialData.forEach((breed) => {
      const option = document.createElement('option');
      option.value = breed.id;
      option.textContent = breed.name;
      breedSelect.appendChild(option);
    });
    console.log("the data i need:", initialData);

    initialData.forEach((breed, index) => {
         infoDump.innerHTML = `<h2>Name: ${breed.name}</h2> 
         <h6>Breed ${index + 1}: </h6>
         <h6>ID: ${breed.id}</h6>
        <p> Description: ${breed.description || "No description available"}</p>
        <p>Temperament: ${breed.temperament || "No temperament available"}</p>
        <p>Origin: ${breed.origin || "No origin available"}</p>`
    });
 
    getBreedInfo(); // Load initial breed info after the breeds are loaded
  } catch (error) {
    console.error(error);
  }

  console.log("ZZZZZZZZinfoDump",infoDump)
//   infoDump.innerHTML = "";
//   const carouselInner = document.getElementById("carouselInner");
}

document.addEventListener('DOMContentLoaded', initialLoad);

async function getBreedInfo() {
  try {
    const breedId = breedSelect.value;
    const { data, durationInMS } = await axios.get('/images/search', {
      params: {
        limit: 10,
        breed_ids: breedId,
      },
      onDownloadProgress: updateProgress,
    });

    if (!data || data.length === 0) {
      throw new Error('No data was returned from the API');
    }

    console.log(`Get breed info request duration: ${durationInMS}ms`);
    Carousel.clear();

    if (data.length === 0) {
      infoDump.innerHTML = `<h2>No breed info available</h2>`;
      return;
    }
    console.log('the whole data is:', data);
  
  console.log("infoDump", infoDump.innerHTML)

      infoDump.innerHTML = `<h2>${infoDump.innerHTML}</h2>`;
 

    data.forEach((breed) => {
      const breedName = breed.breeds && breed.breeds[0] ? breed.breeds[0].name : 'Unknown';
      const carouselItem = Carousel.createCarouselItem(breed.url, breedName, breed.id);
      Carousel.appendCarousel(carouselItem);
    });

    Carousel.start(); // Restart the carousel to update with new items

  } catch (error) {
    console.error(error);
    infoDump.innerHTML = `<h2>Error loading breed info</h2>`;
  }
}

breedSelect.addEventListener('change', getBreedInfo);

export async function favourite(imgId) {
  try {
    const { data, durationInMS } = await axios.post('/favourites', {
      image_id: imgId,
    });
    if (!data) {
      throw new Error('No data was returned from the API');
    }
    console.log(`Favourite request duration: ${durationInMS}ms`);
  } catch (error) {
    console.error(error);
  }
}

async function getFavourites() {
  try {
    const { data, durationInMS } = await axios.get('/favourites', {
      onDownloadProgress: updateProgress,
    });
    if (!data) {
      throw new Error('No data was returned from the API');
    }
    console.log(`Get favourites request duration: ${durationInMS}ms`);
    Carousel.clear();
    data.forEach((favourite) => {
      const carouselItem = Carousel.createCarouselItem(favourite.image.url, null, favourite.image.id);
      Carousel.appendCarousel(carouselItem);
    });
    Carousel.start(); // Restart the carousel to update with new items
  } catch (error) {
    console.error(error);
  }
}

getFavouritesBtn.addEventListener('click', getFavourites);