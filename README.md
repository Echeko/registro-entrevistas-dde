# Registro Digital de Entrevistas - DDE

Sistema de registro de entrevistas para la Dirección Distrital de Educación.

## Stack
- HTML + CSS + JavaScript vanilla
- Supabase (PostgreSQL + Auth + RLS)
- Netlify (Hosting)

## Instalación rápida
1. Ejecutar `sql/schema.sql` en Supabase SQL Editor
2. Crear usuario admin en Supabase -> Authentication -> Users
3. Editar `assets/js/supabase-client.js` con tus credenciales
4. Subir a Netlify (arrastrar carpeta o conectar GitHub)

## Estructura
- `index.html` -> Formulario publico
- `admin/login.html` -> Login administrador
- `admin/dashboard.html` -> Panel con estadisticas
- `admin/registros.html` -> Listado con filtros

## Autor
Direccion Distrital de Educacion - 2026
