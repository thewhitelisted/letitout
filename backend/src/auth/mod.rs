use actix_web::{
    dev::ServiceRequest, error::ErrorUnauthorized, web, Error, FromRequest, HttpMessage, HttpRequest,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use futures::future::{ready, Ready};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use std::{
    env,
    future::{self, Future},
    pin::Pin,
};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
}

pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    Ok(argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string())
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    let parsed_hash = match PasswordHash::new(hash) {
        Ok(parsed_hash) => parsed_hash,
        Err(_) => return false,
    };

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
}

pub fn generate_jwt(user_id: &Uuid) -> Result<String, jsonwebtoken::errors::Error> {
    let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let expiration = Utc::now() + Duration::days(7);
    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration.timestamp() as usize,
        iat: Utc::now().timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
}

pub fn validate_jwt(token: &str) -> Result<TokenData<Claims>, jsonwebtoken::errors::Error> {
    let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
}

pub struct AuthenticatedUser {
    pub user_id: Uuid,
}

impl FromRequest for AuthenticatedUser {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _payload: &mut actix_web::dev::Payload) -> Self::Future {
        let auth_header = req.headers().get("Authorization");
        let auth_header = match auth_header {
            Some(header) => header,
            None => {
                return Box::pin(future::ready(Err(ErrorUnauthorized(
                    "No authorization header found",
                ))));
            }
        };

        let auth_str = match auth_header.to_str() {
            Ok(str) => str,
            Err(_) => {
                return Box::pin(future::ready(Err(ErrorUnauthorized(
                    "Invalid authorization header",
                ))));
            }
        };

        if !auth_str.starts_with("Bearer ") {
            return Box::pin(future::ready(Err(ErrorUnauthorized(
                "Invalid authorization header format",
            ))));
        }

        let token = &auth_str[7..];
        let token_data = match validate_jwt(token) {
            Ok(data) => data,
            Err(_) => {
                return Box::pin(future::ready(Err(ErrorUnauthorized("Invalid token"))));
            }
        };

        let user_id = match Uuid::parse_str(&token_data.claims.sub) {
            Ok(id) => id,
            Err(_) => {
                return Box::pin(future::ready(Err(ErrorUnauthorized(
                    "Invalid user ID in token",
                ))));
            }
        };

        Box::pin(future::ready(Ok(AuthenticatedUser { user_id })))
    }
}
