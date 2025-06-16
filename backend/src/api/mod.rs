pub mod auth;
pub mod thoughts;
pub mod todos;

use actix_web::web;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .configure(auth::configure)
            .configure(thoughts::configure)
            .configure(todos::configure),
    );
}
