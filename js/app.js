function iniciarApp() {

    const resultado = document.querySelector('#resultado');
    const modal = new bootstrap.Modal('#modal', {});
    const selectCategorias = document.querySelector('#categorias');

    //Para evitar errores con el html de favoritos
    if(selectCategorias){
        selectCategorias.addEventListener('change', seleccionarCategoria);
        obtenerCategorias();
    }

    //archivo favoritos
    const favoritoDiv = document.querySelector('.favoritos');

    if( favoritoDiv) {
        obtenerFavoritos();
    }
    



    function obtenerCategorias() {
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';

        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarCategorias(resultado.categories));
    }

    function mostrarCategorias( categorias = [] ) {

        categorias.forEach( categoria => {
            const { strCategory } = categoria;
            const option = document.createElement('OPTION');
            option.value = strCategory;
            option.textContent = strCategory;
            selectCategorias.appendChild(option)
        })
    }

    function seleccionarCategoria(e) {
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

        fetch(url)
            .then( respuesta => respuesta.json())
            .then( resultado => mostrarRecetas(resultado.meals));
    }

    function mostrarRecetas( recetas = [] ) {

        limpiarHtml(resultado);

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? 'Resultados' : 'No hay Resultados';
        resultado.appendChild(heading);

        //Iterar en los resultados
        recetas.forEach( receta => {

            const { idMeal, strMeal, strMealThumb } = receta;

            const recetaContenedor = document.createElement('DIV');
            recetaContenedor.classList.add('col-md-4');
            
            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            const recetaImagen = document.createElement('IMG');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Imagen de la receta ${strMeal}`;
            recetaImagen.src = strMealThumb ?? receta.img;

            const recetaCardBody = document.createElement('DIV');
            recetaCardBody.classList.add('card-body');

            const recetaHeading = document.createElement('H3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.title ;

            const recetaButton = document.createElement('BUTTON');
            recetaButton.classList.add('btn', 'btn-danger', 'w-100');
            recetaButton.textContent = 'Ver Receta';
            // recetaButton.dataset.bsTarget = "#modal";
            // recetaButton.dataset.bsToggle = "modal";


            recetaButton.onclick = function() {
                seleccionarReceta(idMeal ?? receta.id);
            }
            

            //Inyectar Codigo

            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaButton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard);

            resultado.appendChild(recetaContenedor);
            
        })
    }

    function seleccionarReceta(id) {
        const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        
        fetch(url)
            .then( respuesta => respuesta.json())
            .then( resultado => mostrarRecetaModal(resultado.meals[0]));
    }

    function mostrarRecetaModal(receta) {
        //Muestra el modal 

        const { idMeal, strInstructions, strMeal, strMealThumb } = receta;
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}"/>
            <h3 class="my-3">Instruction</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredinetes y Cantidades</h3>
        `;

        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');

        for(let i = 1; i <= 20; i++) {
            if(receta[`strIngredient${i}`]){
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;

                listGroup.appendChild(ingredienteLi);
            }
        }

        //Insertar en el body del modal
        modalBody.appendChild(listGroup);

        const modalFooter = document.querySelector('.modal-footer');

        limpiarHtml(modalFooter);

        //Botones de cerrar y favoritos
        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-danger', 'col'); 
        btnFavorito.textContent = existeStorage(idMeal) ? 'Eliminar Favorito' : 'Guarda Favorito';

        const btnCerrar= document.createElement('BUTTON');
        btnCerrar.classList.add('btn', 'btn-secondary', 'col');
        btnCerrar.textContent = 'Cerrar';

        //Cerrar con el boton modal
        btnCerrar.onclick = () => {
            modal.hide();
        }

        //Agregar favorito
        btnFavorito.onclick = () => {

            //Verificar si existe ese favorito
            if(existeStorage(idMeal)) {
                eliminarFavorito(idMeal);
                btnFavorito.textContent = 'Guardar Favorito';
                mostrarToast('Eliminado Correctamente');
                return;
            }

            agregarFavorito({
                id: idMeal,
                title: strMeal,
                img: strMealThumb
            });

            mostrarToast('Agregado Correctamente');
            btnFavorito.textContent = 'Eliminar Favorito';
        }
    
        //Agregar al al modal los elementos creados
        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(btnCerrar);
        //Muestra el modal
        modal.show();
    }

    function agregarFavorito(receta) {
        // EL operador ?? nullish coalescing assignmen solo asigna si es null 
        const favoritos = JSON.parse( localStorage.getItem('favoritos') ) ?? [];
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));
    }

    function existeStorage(id) {
        const favoritos = JSON.parse( localStorage.getItem('favoritos') ) ?? [];
        //Vericamos si hay alguno con ese id 
        return favoritos.some( favorito => favorito.id === id);
    }

    function eliminarFavorito(id) {
        const favoritos = JSON.parse( localStorage.getItem('favoritos') ) ?? [];
        const nuevosFavoritos = favoritos.filter(favorito =>  favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
        
    }

    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje;
        toast.show();

        
    }

    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        
        if(favoritos.length) {
            mostrarRecetas(favoritos)
            return;
        }

        const noFavoritos = document.createElement('P');
        noFavoritos.classList.add('fs-4', 'text-center', 'font--bold', 'mt-5');
        noFavoritos.textContent = 'No hay Favoritos aun';
        favoritoDiv.appendChild(noFavoritos);
    }

    function limpiarHtml(selector) {
        while(selector.firstChild){
            selector.removeChild(selector.firstChild);
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);