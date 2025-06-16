use chrono::{DateTime, Utc};
use sqlx::{postgres::PgPool, Error};
use uuid::Uuid;

use crate::models::{
    CreateThoughtRequest, CreateTodoRequest, CreateUserRequest, Thought, Todo, UpdateTodoRequest, User,
};

pub async fn create_user(
    pool: &PgPool,
    user_data: &CreateUserRequest,
    password_hash: &str,
) -> Result<User, Error> {
    sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, password_hash, created_at, updated_at
        "#,
        user_data.name,
        user_data.email,
        password_hash
    )
    .fetch_one(pool)
    .await
}

pub async fn find_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, Error> {
    sqlx::query_as!(
        User,
        r#"
        SELECT id, name, email, password_hash, created_at, updated_at
        FROM users
        WHERE email = $1
        "#,
        email
    )
    .fetch_optional(pool)
    .await
}

pub async fn find_user_by_id(pool: &PgPool, id: &Uuid) -> Result<Option<User>, Error> {
    sqlx::query_as!(
        User,
        r#"
        SELECT id, name, email, password_hash, created_at, updated_at
        FROM users
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(pool)
    .await
}

// Thoughts
pub async fn create_thought(
    pool: &PgPool,
    user_id: &Uuid,
    thought_data: &CreateThoughtRequest,
) -> Result<Thought, Error> {
    sqlx::query_as!(
        Thought,
        r#"
        INSERT INTO thoughts (user_id, content)
        VALUES ($1, $2)
        RETURNING id, user_id, content, created_at, updated_at
        "#,
        user_id,
        thought_data.content
    )
    .fetch_one(pool)
    .await
}

pub async fn get_thoughts_by_user(pool: &PgPool, user_id: &Uuid) -> Result<Vec<Thought>, Error> {
    sqlx::query_as!(
        Thought,
        r#"
        SELECT id, user_id, content, created_at, updated_at
        FROM thoughts
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
        user_id
    )
    .fetch_all(pool)
    .await
}

pub async fn get_thought_by_id(
    pool: &PgPool,
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<Thought>, Error> {
    sqlx::query_as!(
        Thought,
        r#"
        SELECT id, user_id, content, created_at, updated_at
        FROM thoughts
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user_id
    )
    .fetch_optional(pool)
    .await
}

pub async fn delete_thought(pool: &PgPool, id: &Uuid, user_id: &Uuid) -> Result<bool, Error> {
    let result = sqlx::query!(
        r#"
        DELETE FROM thoughts
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user_id
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

// Todos
pub async fn create_todo(
    pool: &PgPool,
    user_id: &Uuid,
    todo_data: &CreateTodoRequest,
) -> Result<Todo, Error> {
    sqlx::query_as!(
        Todo,
        r#"
        INSERT INTO todos (user_id, title, description, due_date)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, title, description, completed, due_date, created_at, updated_at
        "#,
        user_id,
        todo_data.title,
        todo_data.description,
        todo_data.due_date
    )
    .fetch_one(pool)
    .await
}

pub async fn get_todos_by_user(pool: &PgPool, user_id: &Uuid) -> Result<Vec<Todo>, Error> {
    sqlx::query_as!(
        Todo,
        r#"
        SELECT id, user_id, title, description, completed, due_date, created_at, updated_at
        FROM todos
        WHERE user_id = $1
        ORDER BY 
            CASE WHEN completed THEN 1 ELSE 0 END,
            CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
            due_date ASC,
            created_at DESC
        "#,
        user_id
    )
    .fetch_all(pool)
    .await
}

pub async fn get_todo_by_id(
    pool: &PgPool,
    id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<Todo>, Error> {
    sqlx::query_as!(
        Todo,
        r#"
        SELECT id, user_id, title, description, completed, due_date, created_at, updated_at
        FROM todos
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user_id
    )
    .fetch_optional(pool)
    .await
}

pub async fn update_todo(
    pool: &PgPool,
    id: &Uuid,
    user_id: &Uuid,
    todo_data: &UpdateTodoRequest,
) -> Result<Option<Todo>, Error> {
    let todo = get_todo_by_id(pool, id, user_id).await?;

    if todo.is_none() {
        return Ok(None);
    }

    let todo = todo.unwrap();
    
    let title = todo_data.title.as_ref().unwrap_or(&todo.title);
    let description = match &todo_data.description {
        Some(desc) => Some(desc.as_str()),
        None => todo.description.as_deref(),
    };
    let completed = todo_data.completed.unwrap_or(todo.completed);
    let due_date = todo_data.due_date.or(todo.due_date);

    sqlx::query_as!(
        Todo,
        r#"
        UPDATE todos
        SET title = $3, description = $4, completed = $5, due_date = $6, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, title, description, completed, due_date, created_at, updated_at
        "#,
        id,
        user_id,
        title,
        description,
        completed,
        due_date
    )
    .fetch_one(pool)
    .await
}

pub async fn delete_todo(pool: &PgPool, id: &Uuid, user_id: &Uuid) -> Result<bool, Error> {
    let result = sqlx::query!(
        r#"
        DELETE FROM todos
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user_id
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
