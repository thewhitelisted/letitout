use actix_cors::Cors;
use actix_web::{http, middleware, App, HttpServer};
use dotenv::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::env;

mod api;
mod auth;
mod config;
mod db;
mod models;
mod utils;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in environment variables");
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

    // Set up database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create database connection pool");

    // Run database migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run database migrations");

    println!("Server running at http://{}:{}", host, port);

    // Start HTTP server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT, http::header::CONTENT_TYPE])
            .max_age(3600);

        App::new()
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .app_data(actix_web::web::Data::new(pool.clone()))
            .configure(api::configure)
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}
