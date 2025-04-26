
document.addEventListener("DOMContentLoaded", () => {
    const favContainer = document.querySelector(".recipe-container");
    let favoriteMeals = JSON.parse(localStorage.getItem("favoriteMeals")) || [];

    if (favoriteMeals.length === 0) {
        favContainer.innerHTML = `<h2 style="color: white;" >No favorite recipes added yet.</h2>`;
        return;
    }

    favoriteMeals.forEach(meals => {
        let favDiv = document.createElement("div");
        favDiv.classList.add('fav-item');
        favDiv.innerHTML = `
            <img src="${meals.strMealThumb}">
            <h3>${meals.strMeal}</h3>
                <p><span>${meals.strArea}</span> Dish</p>
                <p>Belongs to <span>${meals.strCategory}</span> Category</p>
            <button class="remove-btn" data-id="${meals.idMeal}">Remove</button>
        `;

        favDiv.querySelector(".remove-btn").addEventListener("click", (e) => {
            let idMeal = e.target.getAttribute("data-id");
            favoriteMeals = favoriteMeals.filter(item => item.idMeal !== idMeal);
            localStorage.setItem("favoriteMeals", JSON.stringify(favoriteMeals));
            location.reload();
        });

        favContainer.appendChild(favDiv);
    });
});

 