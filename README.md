# Blog Personal
Aplicación web tipo blog personal con autenticación de usuarios, CRUD de publicaciones y persistencia en LocalStorage.

## Funcionalidades

- **Autenticación**: Registro, login y logout de usuarios
- **Seguridad**: Contraseñas hasheadas (djb2) en LocalStorage
- **CRUD completo**: Crear, leer, editar y eliminar publicaciones
- **Persistencia**: LocalStorage (sin backend requerido)
- **Interfaz responsiva**: Funciona en móvil y desktop
- **Vista individual**: Detalle completo de cada entrada

## Estructura del Proyecto

```
personal-blog/
├── index.html
├── styles.css 
└── app.js 

## Tecnologías

- HTML5 semántico
- CSS3 (variables, grid, flexbox, animaciones)
- JavaScript ES6+ vanilla
- LocalStorage API
- Google Fonts (Playfair Display + DM Sans)

## Rutas equivalentes (SPA)

| Vista (lógica)     | Descripción               |
|--------------------|---------------------------|
| Landing            | Página de bienvenida      |
| `/register`        | Formulario de registro    |
| `/login`           | Formulario de login       |
| `/blog`            | Listado de publicaciones  |
| `/post/:id`        | Vista de detalle          |
| `/post/new`        | Crear publicación         |
| `/post/:id/edit`   | Editar publicación        |
