const searchBox = document.querySelector('.searchBox');
const searchBtn = document.querySelector('.searchBtn');
const recipeContainer = document.querySelector('.recipe-container');
const recipeSection = document.querySelector('.recipe-section');
const recipeDetailsContent = document.querySelector('.recipe-details-content');
const closeBtn = document.querySelector('.recipe-close-btn');
const clearBtn = document.querySelector('.clear-btn');
let clearResultsBtn = document.querySelector('.clear-results-btn');

// Fallback for clearResultsBtn
if (!clearResultsBtn) {
    clearResultsBtn = document.getElementsByClassName('clear-results-btn')[0];
}
console.log('Initialized - searchBox:', searchBox, 'searchBtn:', searchBtn, 'clearBtn:', clearBtn, 'clearResultsBtn:', clearResultsBtn, 'recipeSection:', recipeSection);

// Debounce function with cancellation
let debounceTimeout;
const debounce = (func, delay) => {
    return (...args) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => func(...args), delay);
    };
};

// Cancel pending debounced searches
const cancelDebounce = () => {
    clearTimeout(debounceTimeout);
    console.log('Cancelled pending debounced searches');
};

// Flag to prevent input events during programmatic clear
let isProgrammaticClear = false;

// Function to fetch recipes with retry logic
const fetchRecipes = async (query, retries = 3) => {
    recipeContainer.innerHTML = '<div class="spinner"></div>';
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.setAttribute('aria-disabled', 'true');
    }

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();

            recipeContainer.innerHTML = '';

            if (!data.meals) {
                recipeContainer.innerHTML = '<h2 style="color: #fff;">No recipes found. Try another search!</h2>';
                if (clearResultsBtn) {
                    clearResultsBtn.style.display = 'none';
                    console.log('No recipes, hiding clearResultsBtn');
                }
                if (recipeSection) {
                    recipeSection.style.display = 'block'; // Show section even for no results
                    console.log('recipeSection shown for no results');
                }
                if (searchBtn) {
                    searchBtn.disabled = false;
                    searchBtn.setAttribute('aria-disabled', 'false');
                }
                return;
            }

            data.meals.forEach(meal => {
                const recipeDiv = document.createElement('div');
                recipeDiv.classList.add('recipe');
                recipeDiv.setAttribute('role', 'article');
                recipeDiv.innerHTML = `
                    <div style="position: relative;">
                        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" style="width: 100%; border-radius: 6px;">
                        <button class="favorite-btn" style="position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer;" aria-label="${isFavorite(meal) ? 'Remove from favorites' : 'Add to favorites'}">
                            ${isFavorite(meal) ? 
                                `<i class="fa-solid fa-heart" style="font-size: 24px; color: red;"></i>` : 
                                `<i class="fa-regular fa-heart" style="font-size: 24px; color: green;"></i>`}
                        </button>
                    </div>
                    <h3>${meal.strMeal}</h3>
                    <p><span>${meal.strArea}</span> Dish</p>
                    <p>Belongs to <span>${meal.strCategory}</span> Category</p>
                `;

                const button = document.createElement('button');
                button.textContent = 'View Recipe';
                button.setAttribute('aria-label', `View recipe for ${meal.strMeal}`);
                recipeDiv.appendChild(button);

                button.addEventListener('click', () => openRecipePopup(meal));

                const favoriteBtn = recipeDiv.querySelector('.favorite-btn');
                favoriteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(meal, favoriteBtn);
                });

                recipeContainer.appendChild(recipeDiv);
            });

            if (clearResultsBtn) {
                clearResultsBtn.style.display = 'block';
                console.log('Recipes loaded, showing clearResultsBtn');
            }
            if (recipeSection) {
                recipeSection.style.display = 'block'; // Show section when results are loaded
                console.log('recipeSection shown for results');
            }
            if (searchBtn) {
                searchBtn.disabled = false;
                searchBtn.setAttribute('aria-disabled', 'false');
            }
            return;
        } catch (error) {
            console.error('Error fetching recipes:', error);
            if (i === retries - 1) {
                recipeContainer.innerHTML = '<h2 style="color: #fff;">Failed to fetch recipes. Please check your connection and try again.</h2>';
                if (clearResultsBtn) {
                    clearResultsBtn.style.display = 'none';
                    console.log('Fetch failed, hiding clearResultsBtn');
                }
                if (recipeSection) {
                    recipeSection.style.display = 'block'; // Show section for error message
                    console.log('recipeSection shown for error');
                }
                if (searchBtn) {
                    searchBtn.disabled = false;
                    searchBtn.setAttribute('aria-disabled', 'false');
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

// Function to check if a meal is in favorites
const isFavorite = (meal) => {
    const favoriteMeals = JSON.parse(localStorage.getItem('favoriteMeals')) || [];
    return favoriteMeals.some(item => item.idMeal === meal.idMeal);
};

// Function to toggle favorite
const toggleFavorite = (meal, favoriteBtn) => {
    let favoriteMeals = JSON.parse(localStorage.getItem('favoriteMeals')) || [];
    const index = favoriteMeals.findIndex(item => item.idMeal === meal.idMeal);

    if (index === -1) {
        favoriteMeals.push(meal);
        favoriteBtn.innerHTML = `<i class="fa-solid fa-heart" style="font-size: 24px; color: red;"></i>`;
        favoriteBtn.setAttribute('aria-label', 'Remove from favorites');
    } else {
        favoriteMeals.splice(index, 1);
        favoriteBtn.innerHTML = `<i class="fa-regular fa-heart" style="font-size: 24px; color: green;"></i>`;
        favoriteBtn.setAttribute('aria-label', 'Add to favorites');
    }

    localStorage.setItem('favoriteMeals', JSON.stringify(favoriteMeals));
};

// Function to fetch ingredients
const fetchIngredients = (meal) => {
    let ingredientsList = '';
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        if (ingredient) {
            const measure = meal[`strMeasure${i}`] || '';
            ingredientsList += `<li>${measure} ${ingredient}</li>`;
        } else {
            break;
        }
    }
    return ingredientsList;
};

// Function to open recipe popup
const openRecipePopup = (meal) => {
    const youtubeEmbedUrl = meal.strYoutube ? meal.strYoutube.replace('watch?v=', 'embed/') : null;
    recipeDetailsContent.innerHTML = `
        <h2 class="recipeName">${meal.strMeal}</h2>
        <h3>Ingredients:</h3>
        <ul class="ingredientList">${fetchIngredients(meal)}</ul>
        <div>
            <h3>Instructions:</h3>
            <p class="recipeInstructions">${meal.strInstructions}</p>
        </div>
        ${youtubeEmbedUrl ? `
            <div class="recipeVideo">
                <h3>Recipe Video:</h3>
                <iframe width="100%" height="315" src="${youtubeEmbedUrl}" title="Recipe Video for ${meal.strMeal}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        ` : ''}
    `;
    recipeDetailsContent.parentElement.style.display = 'block';
    recipeDetailsContent.parentElement.focus();
};

// Function to reset UI
const resetUI = (reloadRecipes = true, clearContainer = true) => {
    console.log('Resetting UI, reloadRecipes:', reloadRecipes, 'clearContainer:', clearContainer);
    isProgrammaticClear = true; // Block input events
    cancelDebounce(); // Cancel pending searches
    if (searchBox) {
        searchBox.value = '';
        searchBox.focus();
        console.log('Search input cleared');
    }
    if (clearBtn) {
        clearBtn.style.display = 'none';
        console.log('clearBtn hidden');
    }
    if (clearResultsBtn) {
        clearResultsBtn.style.display = 'none';
        console.log('clearResultsBtn hidden');
    }
    if (recipeContainer && clearContainer) {
        console.log('Clearing recipeContainer');
        recipeContainer.innerHTML = '';
        recipeContainer.offsetHeight; // Trigger reflow
        console.log('recipeContainer cleared, innerHTML:', recipeContainer.innerHTML);
    }
    if (recipeSection && !reloadRecipes) {
        recipeSection.style.display = 'none'; // Hide section when not reloading
        console.log('recipeSection hidden');
    }
    if (reloadRecipes) {
        console.log('Reloading all recipes');
        fetchRecipes('');
    } else {
        console.log('Skipping recipe reload, container remains empty');
    }
    setTimeout(() => {
        isProgrammaticClear = false; // Re-enable input events
        console.log('Re-enabled input events');
    }, 0);
};

// Debounced search function
const debouncedSearch = debounce((query) => {
    query = query.trim();
    if (query) {
        console.log('Debounced search for:', query);
        fetchRecipes(query);
    } else {
        console.log('Skipped debounced search: empty query');
    }
}, 500);

// Event listeners setup
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired, script.js loaded');

    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const searchInput = searchBox ? searchBox.value.trim() : '';
            console.log('Search button clicked, input:', searchInput);
            if (!searchInput) {
                recipeContainer.innerHTML = '<h2 style="color: #fff;">Please enter a meal to search.</h2>';
                if (clearResultsBtn) {
                    clearResultsBtn.style.display = 'none';
                    console.log('Empty search, hiding clearResultsBtn');
                }
                if (recipeSection) {
                    recipeSection.style.display = 'block'; // Show section for empty search message
                    console.log('recipeSection shown for empty search');
                }
                if (searchBox) searchBox.focus();
                return;
            }
            fetchRecipes(searchInput);
        });
    }

    // Search input Enter key
    if (searchBox) {
        searchBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchInput = searchBox.value.trim();
                console.log('Enter key pressed, input:', searchInput);
                if (!searchInput) {
                    recipeContainer.innerHTML = '<h2 style="color: #fff;">Please enter a meal to search.</h2>';
                    if (clearResultsBtn) {
                        clearResultsBtn.style.display = 'none';
                        console.log('Empty Enter, hiding clearResultsBtn');
                    }
                    if (recipeSection) {
                        recipeSection.style.display = 'block'; // Show section for empty search message
                        console.log('recipeSection shown for empty search');
                    }
                    searchBox.focus();
                    return;
                }
                fetchRecipes(searchInput);
            }
        });

        // Debounced search on input
        searchBox.addEventListener('input', (e) => {
            if (isProgrammaticClear) {
                console.log('Input event ignored: programmatic clear');
                return;
            }
            const searchInput = e.target.value.trim();
            console.log('Input changed:', searchInput);
            if (clearBtn) {
                clearBtn.style.display = searchInput ? 'block' : 'none';
                console.log('clearBtn display:', clearBtn.style.display);
            }
            debouncedSearch(searchInput);
        });
    }

    // Clear search button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            console.log('Clear search button clicked');
            resetUI(false, true); // Clear container, do not reload recipes
            console.log('Clear search completed');
            // Log container state after a delay to confirm it stays empty
            setTimeout(() => {
                console.log('Container state after clear:', recipeContainer.innerHTML);
                console.log('recipeSection display after clear:', recipeSection ? recipeSection.style.display : 'null');
            }, 1000);
        });
    }

    // Clear results button
    if (clearResultsBtn) {
        clearResultsBtn.addEventListener('click', () => {
            console.log('Clear Results button clicked');
            resetUI(true, true); // Reload all recipes
            console.log('Clear results completed');
        });
    }

    // Close recipe popup
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log('Close popup clicked');
            recipeDetailsContent.parentElement.style.display = 'none';
            if (searchBox) searchBox.focus();
        });
    }

    // Initial setup: hide buttons, no initial fetch
    if (clearBtn) clearBtn.style.display = 'none';
    if (clearResultsBtn) clearResultsBtn.style.display = 'none';
    console.log('Initial setup complete, no recipes loaded');
});