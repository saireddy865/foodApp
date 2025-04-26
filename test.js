
// Function to reset UI
const resetUI = (reloadRecipes = true, clearContainer = true) => {
  console.log('Resetting UI, reloadRecipes:', reloadRecipes, 'clearContainer:', clearContainer);
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
    console.log('recipeContainer cleared');
  }
  if (reloadRecipes) {
    console.log('Reloading all recipes');
    fetchRecipes('');
  } else {
    console.log('Skipping recipe reload');
  }
};

// Clear search button
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    console.log('Clear search button clicked');
    resetUI(false, true); // Clear container and do not reload recipes
    console.log('Clear search completed');
  });
}

