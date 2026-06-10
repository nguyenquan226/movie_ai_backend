export const BackenDBQuery = {
  all_user: `
    SELECT 
      "User"."userId" AS "User_userId",
      "User"."email" AS "User_email",
      "User"."fullName" AS "User_fullName",
      "User"."phoneNumber" AS "User_phoneNumber",
      "User"."avatarUrl" AS "User_avatarUrl",
      "User"."gender_code" AS "User_gender_code",
      "User"."age" AS "User_age",
      "User"."role_id" AS "User_role_id",
      "User"."birthDate" AS "User_birthDate",
      "User"."isVip" AS "User_isVip",
      "User"."status_code" AS "User_status_code",
      "User"."vipExpireDate" AS "User_vipExpireDate",
      "User"."refreshToken" AS "User_refreshToken",
      "User"."isDeleted" AS "User_isDeleted",
      "User"."createdAt" AS "User_createdAt",
      "User"."updatedAt" AS "User_updatedAt",
      "User"."deletedAt" AS "User_deletedAt",
      "User"."createdBy" AS "User_createdBy",
      "User"."updatedBy" AS "User_updatedBy",
      "User"."deletedBy" AS "User_deletedBy"
    FROM "users" "User"
    WHERE "User"."isDeleted" = false
    ORDER BY "User"."createdAt" DESC
    LIMIT 50;
  `,

  filmDetailQuery: `
    SELECT
      film."filmId",
      film."originalTitle",
      film."title",
      film."description",
      film."releaseDate",
      film."year",
      film."thumbUrl",
      film."slug",
      film."duration",
      film."view",
      film."ageCode",
      film."typeCode",
      film."countryCode",
      film."langCode",
      film."publicStatusCode",
      film."createdAt",
      film."updatedAt",
      film."deletedAt",
      film."createdById",
      film."updatedById",
      film."deletedById",

      language."keyMap" AS "language_keyMap",
      language."valueEn" AS "language_valueEn",
      language."valueVi" AS "language_valueVi",

      age."keyMap" AS "age_keyMap",
      type."keyMap" AS "type_keyMap",
      country."keyMap" AS "country_keyMap",
      publicStatus."keyMap" AS "publicStatus_keyMap",

      filmGenres."genreCode" AS "genreCode",
      filmImages."url" AS "imageUrl",
      genre."valueVi" AS "genre_valueVi"

    FROM "films" film
    LEFT JOIN "all_code" language 
      ON language."keyMap" = film."langCode"
    LEFT JOIN "all_code" age 
      ON age."keyMap" = film."ageCode"
    LEFT JOIN "all_code" type 
      ON type."keyMap" = film."typeCode"
    LEFT JOIN "all_code" country 
      ON country."keyMap" = film."countryCode"
    LEFT JOIN "all_code" publicStatus 
      ON publicStatus."keyMap" = film."publicStatusCode"
    LEFT JOIN "film_genre" filmGenres 
      ON filmGenres."filmId" = film."filmId"
    LEFT JOIN "film_images" filmImages 
      ON filmImages."filmId" = film."filmId"
      AND filmImages."deletedAt" IS NULL
    LEFT JOIN "all_code" genre 
      ON genre."keyMap" = filmGenres."genreCode"
    WHERE film."slug" = $1
      AND film."deletedAt" IS NULL;
  `,

  filmBYName: `
    SELECT DISTINCT
      "distinctAlias"."Film_filmId" AS "ids_Film_filmId",
      "distinctAlias"."Film_createdAt"
    FROM (
      SELECT
        "Film"."filmId" AS "Film_filmId",
        "Film"."originalTitle" AS "Film_originalTitle",
        "Film"."title" AS "Film_title",
        "Film"."description" AS "Film_description",
        "Film"."releaseDate" AS "Film_releaseDate",
        "Film"."year" AS "Film_year",
        "Film"."thumbUrl" AS "Film_thumbUrl",
        "Film"."slug" AS "Film_slug",
        "Film"."duration" AS "Film_duration",
        "Film"."view" AS "Film_view",
        "Film"."ageCode" AS "Film_ageCode",
        "Film"."typeCode" AS "Film_typeCode",
        "Film"."countryCode" AS "Film_countryCode",
        "Film"."langCode" AS "Film_langCode",
        "Film"."publicStatusCode" AS "Film_publicStatusCode",
        "Film"."createdAt" AS "Film_createdAt",
        "Film"."updatedAt" AS "Film_updatedAt",
        "Film"."deletedAt" AS "Film_deletedAt",
        "Film"."createdById" AS "Film_createdBy",
        "Film"."updatedById" AS "Film_updatedBy",
        "Film"."deletedById" AS "Film_deletedBy",

        "Film__Film_language"."id" AS "Film__Film_language_id",
        "Film__Film_language"."keyMap" AS "Film__Film_language_keyMap",
        "Film__Film_language"."type" AS "Film__Film_language_type",
        "Film__Film_language"."valueEn" AS "Film__Film_language_valueEn",
        "Film__Film_language"."valueVi" AS "Film__Film_language_valueVi",
        "Film__Film_language"."description" AS "Film__Film_language_description",
        "Film__Film_language"."createdAt" AS "Film__Film_language_createdAt",
        "Film__Film_language"."updatedAt" AS "Film__Film_language_updatedAt",

        "Film__Film_age"."id" AS "Film__Film_age_id",
        "Film__Film_age"."keyMap" AS "Film__Film_age_keyMap",
        "Film__Film_age"."type" AS "Film__Film_age_type",
        "Film__Film_age"."valueEn" AS "Film__Film_age_valueEn",
        "Film__Film_age"."valueVi" AS "Film__Film_age_valueVi",
        "Film__Film_age"."description" AS "Film__Film_age_description",
        "Film__Film_age"."createdAt" AS "Film__Film_age_createdAt",
        "Film__Film_age"."updatedAt" AS "Film__Film_age_updatedAt",

        "Film__Film_filmGenres"."id" AS "Film__Film_filmGenres_id",
        "Film__Film_filmGenres"."filmId" AS "Film__Film_filmGenres_filmId",
        "Film__Film_filmGenres"."genreCode" AS "Film__Film_filmGenres_genreCode",

        "Film__Film_filmGenres__Film__Film_filmGenres_genre"."id" AS "Film__Film_filmGenres_genre_id",
        "Film__Film_filmGenres__Film__Film_filmGenres_genre"."keyMap" AS "Film__Film_filmGenres_genre_keyMap",
        "Film__Film_filmGenres__Film__Film_filmGenres_genre"."type" AS "Film__Film_filmGenres_genre_type",
        "Film__Film_filmGenres__Film__Film_filmGenres_genre"."valueEn" AS "Film__Film_filmGenres_genre_valueEn",
        "Film__Film_filmGenres__Film__Film_filmGenres_genre"."valueVi" AS "Film__Film_filmGenres_genre_valueVi",
        "Film__Film_filmGenres__Film__Film_filmGenres_genre"."description" AS "Film__Film_filmGenres_genre_description",
        "Film__Film_filmGenres__Film__Film_filmGenres_genre"."createdAt" AS "Film__Film_filmGenres_genre_createdAt",
        "Film__Film_filmGenres__Film__Film_filmGenres_genre"."updatedAt" AS "Film__Film_filmGenres_genre_updatedAt",

        "Film__Film_filmImages"."id" AS "Film__Film_filmImages_id",
        "Film__Film_filmImages"."filmId" AS "Film__Film_filmImages_filmId",
        "Film__Film_filmImages"."url" AS "Film__Film_filmImages_url",
        "Film__Film_filmImages"."type" AS "Film__Film_filmImages_type",
        "Film__Film_filmImages"."createdAt" AS "Film__Film_filmImages_createdAt",
        "Film__Film_filmImages"."updatedAt" AS "Film__Film_filmImages_updatedAt",
        "Film__Film_filmImages"."deletedAt" AS "Film__Film_filmImages_deletedAt"

      FROM "films" "Film"
      LEFT JOIN "all_code" "Film__Film_language"
        ON "Film__Film_language"."keyMap" = "Film"."langCode"
      LEFT JOIN "all_code" "Film__Film_age"
        ON "Film__Film_age"."keyMap" = "Film"."ageCode"
      LEFT JOIN "film_genre" "Film__Film_filmGenres"
        ON "Film__Film_filmGenres"."filmId" = "Film"."filmId"
      LEFT JOIN "all_code" "Film__Film_filmGenres__Film__Film_filmGenres_genre"
        ON "Film__Film_filmGenres__Film__Film_filmGenres_genre"."keyMap" = "Film__Film_filmGenres"."genreCode"
      LEFT JOIN "film_images" "Film__Film_filmImages"
        ON "Film__Film_filmImages"."filmId" = "Film"."filmId"
        AND "Film__Film_filmImages"."deletedAt" IS NULL
      WHERE "Film"."deletedAt" IS NULL
    ) "distinctAlias"
    ORDER BY "distinctAlias"."Film_createdAt" DESC, "Film_filmId" ASC
    LIMIT 50 OFFSET 0;
  `,
  filmGenreFullData: `
    SELECT 
      "FilmGenre"."id" AS "FilmGenre_id",
      "FilmGenre"."filmId" AS "FilmGenre_filmId",
      "FilmGenre"."genreCode" AS "FilmGenre_genreCode",

      "FilmGenre__FilmGenre_film"."filmId" AS "film_filmId",
      "FilmGenre__FilmGenre_film"."originalTitle",
      "FilmGenre__FilmGenre_film"."title",
      "FilmGenre__FilmGenre_film"."description",
      "FilmGenre__FilmGenre_film"."releaseDate",
      "FilmGenre__FilmGenre_film"."year",
      "FilmGenre__FilmGenre_film"."thumbUrl",
      "FilmGenre__FilmGenre_film"."slug",
      "FilmGenre__FilmGenre_film"."duration",
      "FilmGenre__FilmGenre_film"."view",
      "FilmGenre__FilmGenre_film"."ageCode",
      "FilmGenre__FilmGenre_film"."typeCode",
      "FilmGenre__FilmGenre_film"."countryCode",
      "FilmGenre__FilmGenre_film"."langCode",
      "FilmGenre__FilmGenre_film"."publicStatusCode",
      "FilmGenre__FilmGenre_film"."createdAt",
      "FilmGenre__FilmGenre_film"."updatedAt",
      "FilmGenre__FilmGenre_film"."deletedAt",
      "FilmGenre__FilmGenre_film"."createdById",
      "FilmGenre__FilmGenre_film"."updatedById",
      "FilmGenre__FilmGenre_film"."deletedById",

      "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_age"."keyMap" AS "age_keyMap",
      "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_age"."valueVi" AS "age_valueVi",

      "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_type"."keyMap" AS "type_keyMap",
      "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_type"."valueVi" AS "type_valueVi",

      "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_country"."keyMap" AS "country_keyMap",
      "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_country"."valueVi" AS "country_valueVi",

      "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_language"."keyMap" AS "lang_keyMap",
      "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_language"."valueVi" AS "lang_valueVi",

      "9699adc4506d381c7fc132a08001dbec37b63b15"."keyMap" AS "publicStatus_keyMap",
      "9699adc4506d381c7fc132a08001dbec37b63b15"."valueVi" AS "publicStatus_valueVi",

      "FilmGenre__FilmGenre_genre"."valueVi" AS "genre_valueVi"

    FROM "film_genre" "FilmGenre"

    LEFT JOIN "films" "FilmGenre__FilmGenre_film"
      ON "FilmGenre__FilmGenre_film"."filmId" = "FilmGenre"."filmId"
      AND "FilmGenre__FilmGenre_film"."deletedAt" IS NULL

    LEFT JOIN "all_code" "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_age"
      ON "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_age"."keyMap" = "FilmGenre__FilmGenre_film"."ageCode"

    LEFT JOIN "all_code" "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_type"
      ON "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_type"."keyMap" = "FilmGenre__FilmGenre_film"."typeCode"

    LEFT JOIN "all_code" "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_country"
      ON "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_country"."keyMap" = "FilmGenre__FilmGenre_film"."countryCode"

    LEFT JOIN "all_code" "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_language"
      ON "FilmGenre__FilmGenre_film__FilmGenre__FilmGenre_film_language"."keyMap" = "FilmGenre__FilmGenre_film"."langCode"

    LEFT JOIN "all_code" "9699adc4506d381c7fc132a08001dbec37b63b15"
      ON "9699adc4506d381c7fc132a08001dbec37b63b15"."keyMap" = "FilmGenre__FilmGenre_film"."publicStatusCode"

    LEFT JOIN "all_code" "FilmGenre__FilmGenre_genre"
      ON "FilmGenre__FilmGenre_genre"."keyMap" = "FilmGenre"."genreCode";
  `,

  filmCountryFullData: `
    SELECT
    "Film"."filmId" AS "Film_filmId",
    "Film"."originalTitle" AS "Film_originalTitle",
    "Film"."title" AS "Film_title",
    "Film"."description" AS "Film_description",
    "Film"."releaseDate" AS "Film_releaseDate",
    "Film"."year" AS "Film_year",
    "Film"."thumbUrl" AS "Film_thumbUrl",
    "Film"."slug" AS "Film_slug",
    "Film"."duration" AS "Film_duration",
    "Film"."view" AS "Film_view",
    "Film"."ageCode" AS "Film_ageCode",
    "Film"."typeCode" AS "Film_typeCode",
    "Film"."countryCode" AS "Film_countryCode",
    "Film"."langCode" AS "Film_langCode",
    "Film"."publicStatusCode" AS "Film_publicStatusCode",
    "Film"."createdAt" AS "Film_createdAt",
    "Film"."updatedAt" AS "Film_updatedAt",
    "Film"."deletedAt" AS "Film_deletedAt",
    "Film"."createdById" AS "Film_createdBy",
    "Film"."updatedById" AS "Film_updatedBy",
    "Film"."deletedById" AS "Film_deletedBy",

    "Film__Film_filmGenres"."id" AS "Film__Film_filmGenres_id",
    "Film__Film_filmGenres"."filmId" AS "Film__Film_filmGenres_filmId",
    "Film__Film_filmGenres"."genreCode" AS "Film__Film_filmGenres_genreCode",

    "Film__Film_filmGenres__Film__Film_filmGenres_genre"."id" AS "Film__Film_filmGenres__Film__Film_filmGenres_genre_id",
    "Film__Film_filmGenres__Film__Film_filmGenres_genre"."keyMap" AS "Film__Film_filmGenres__Film__Film_filmGenres_genre_keyMap",
    "Film__Film_filmGenres__Film__Film_filmGenres_genre"."type" AS "Film__Film_filmGenres__Film__Film_filmGenres_genre_type",
    "Film__Film_filmGenres__Film__Film_filmGenres_genre"."valueEn" AS "Film__Film_filmGenres__Film__Film_filmGenres_genre_valueEn",
    "Film__Film_filmGenres__Film__Film_filmGenres_genre"."valueVi" AS "Film__Film_filmGenres__Film__Film_filmGenres_genre_valueVi",
    "Film__Film_filmGenres__Film__Film_filmGenres_genre"."description" AS "Film__Film_filmGenres__Film__Film_filmGenres_genre_description",
    "Film__Film_filmGenres__Film__Film_filmGenres_genre"."createdAt" AS "Film__Film_filmGenres__Film__Film_filmGenres_genre_createdAt",
    "Film__Film_filmGenres__Film__Film_filmGenres_genre"."updatedAt" AS "Film__Film_filmGenres__Film__Film_filmGenres_genre_updatedAt",

    "Film__Film_age"."id" AS "Film__Film_age_id",
    "Film__Film_age"."keyMap" AS "Film__Film_age_keyMap",
    "Film__Film_age"."type" AS "Film__Film_age_type",
    "Film__Film_age"."valueEn" AS "Film__Film_age_valueEn",
    "Film__Film_age"."valueVi" AS "Film__Film_age_valueVi",
    "Film__Film_age"."description" AS "Film__Film_age_description",
    "Film__Film_age"."createdAt" AS "Film__Film_age_createdAt",
    "Film__Film_age"."updatedAt" AS "Film__Film_age_updatedAt",

    "Film__Film_type"."id" AS "Film__Film_type_id",
    "Film__Film_type"."keyMap" AS "Film__Film_type_keyMap",
    "Film__Film_type"."type" AS "Film__Film_type_type",
    "Film__Film_type"."valueEn" AS "Film__Film_type_valueEn",
    "Film__Film_type"."valueVi" AS "Film__Film_type_valueVi",
    "Film__Film_type"."description" AS "Film__Film_type_description",
    "Film__Film_type"."createdAt" AS "Film__Film_type_createdAt",
    "Film__Film_type"."updatedAt" AS "Film__Film_type_updatedAt",

    "Film__Film_country"."id" AS "Film__Film_country_id",
    "Film__Film_country"."keyMap" AS "Film__Film_country_keyMap",
    "Film__Film_country"."type" AS "Film__Film_country_type",
    "Film__Film_country"."valueEn" AS "Film__Film_country_valueEn",
    "Film__Film_country"."valueVi" AS "Film__Film_country_valueVi",
    "Film__Film_country"."description" AS "Film__Film_country_description",
    "Film__Film_country"."createdAt" AS "Film__Film_country_createdAt",
    "Film__Film_country"."updatedAt" AS "Film__Film_country_updatedAt",

    "Film__Film_language"."id" AS "Film__Film_language_id",
    "Film__Film_language"."keyMap" AS "Film__Film_language_keyMap",
    "Film__Film_language"."type" AS "Film__Film_language_type",
    "Film__Film_language"."valueEn" AS "Film__Film_language_valueEn",
    "Film__Film_language"."valueVi" AS "Film__Film_language_valueVi",
    "Film__Film_language"."description" AS "Film__Film_language_description",
    "Film__Film_language"."createdAt" AS "Film__Film_language_createdAt",
    "Film__Film_language"."updatedAt" AS "Film__Film_language_updatedAt",

    "Film__Film_publicStatus"."id" AS "Film__Film_publicStatus_id",
    "Film__Film_publicStatus"."keyMap" AS "Film__Film_publicStatus_keyMap",
    "Film__Film_publicStatus"."type" AS "Film__Film_publicStatus_type",
    "Film__Film_publicStatus"."valueEn" AS "Film__Film_publicStatus_valueEn",
    "Film__Film_publicStatus"."valueVi" AS "Film__Film_publicStatus_valueVi",
    "Film__Film_publicStatus"."description" AS "Film__Film_publicStatus_description",
    "Film__Film_publicStatus"."createdAt" AS "Film__Film_publicStatus_createdAt",
    "Film__Film_publicStatus"."updatedAt" AS "Film__Film_publicStatus_updatedAt"

  FROM "films" "Film"
  LEFT JOIN "film_genre" "Film__Film_filmGenres"
    ON "Film__Film_filmGenres"."filmId" = "Film"."filmId"

  LEFT JOIN "all_code" "Film__Film_filmGenres__Film__Film_filmGenres_genre"
    ON "Film__Film_filmGenres__Film__Film_filmGenres_genre"."keyMap" = "Film__Film_filmGenres"."genreCode"

  LEFT JOIN "all_code" "Film__Film_age"
    ON "Film__Film_age"."keyMap" = "Film"."ageCode"

  LEFT JOIN "all_code" "Film__Film_type"
    ON "Film__Film_type"."keyMap" = "Film"."typeCode"

  LEFT JOIN "all_code" "Film__Film_country"
    ON "Film__Film_country"."keyMap" = "Film"."countryCode"

  LEFT JOIN "all_code" "Film__Film_language"
    ON "Film__Film_language"."keyMap" = "Film"."langCode"

  LEFT JOIN "all_code" "Film__Film_publicStatus"
    ON "Film__Film_publicStatus"."keyMap" = "Film"."publicStatusCode"

  WHERE "Film"."deletedAt" IS NULL;

  `,

  film_by_actor: `
    SELECT
    "FilmActor"."film_actor_id" AS "FilmActor_film_actor_id",
    "FilmActor"."character_name" AS "FilmActor_character_name",
    "FilmActor"."createdAt" AS "FilmActor_createdAt",
    "FilmActor"."updatedAt" AS "FilmActor_updatedAt",
    "FilmActor"."deletedAt" AS "FilmActor_deletedAt",
    "FilmActor"."createdBy" AS "FilmActor_createdBy",
    "FilmActor"."updatedBy" AS "FilmActor_updatedBy",
    "FilmActor"."deletedBy" AS "FilmActor_deletedBy",
    "FilmActor"."film_id" AS "FilmActor_film_id",
    "FilmActor"."actor_id" AS "FilmActor_actor_id",

    "FilmActor__FilmActor_film"."filmId" AS "FilmActor__FilmActor_film_filmId",
    "FilmActor__FilmActor_film"."originalTitle" AS "FilmActor__FilmActor_film_originalTitle",
    "FilmActor__FilmActor_film"."title" AS "FilmActor__FilmActor_film_title",
    "FilmActor__FilmActor_film"."description" AS "FilmActor__FilmActor_film_description",
    "FilmActor__FilmActor_film"."releaseDate" AS "FilmActor__FilmActor_film_releaseDate",
    "FilmActor__FilmActor_film"."year" AS "FilmActor__FilmActor_film_year",
    "FilmActor__FilmActor_film"."thumbUrl" AS "FilmActor__FilmActor_film_thumbUrl",
    "FilmActor__FilmActor_film"."slug" AS "FilmActor__FilmActor_film_slug",
    "FilmActor__FilmActor_film"."duration" AS "FilmActor__FilmActor_film_duration",
    "FilmActor__FilmActor_film"."view" AS "FilmActor__FilmActor_film_view",
    "FilmActor__FilmActor_film"."ageCode" AS "FilmActor__FilmActor_film_ageCode",
    "FilmActor__FilmActor_film"."typeCode" AS "FilmActor__FilmActor_film_typeCode",
    "FilmActor__FilmActor_film"."countryCode" AS "FilmActor__FilmActor_film_countryCode",
    "FilmActor__FilmActor_film"."langCode" AS "FilmActor__FilmActor_film_langCode",
    "FilmActor__FilmActor_film"."publicStatusCode" AS "FilmActor__FilmActor_film_publicStatusCode",
    "FilmActor__FilmActor_film"."createdAt" AS "FilmActor__FilmActor_film_createdAt",
    "FilmActor__FilmActor_film"."updatedAt" AS "FilmActor__FilmActor_film_updatedAt",
    "FilmActor__FilmActor_film"."deletedAt" AS "FilmActor__FilmActor_film_deletedAt",
    "FilmActor__FilmActor_film"."createdById" AS "FilmActor__FilmActor_film_createdBy",
    "FilmActor__FilmActor_film"."updatedById" AS "FilmActor__FilmActor_film_updatedBy",
    "FilmActor__FilmActor_film"."deletedById" AS "FilmActor__FilmActor_film_deletedBy",

    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"."id" AS "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age_id",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"."keyMap" AS "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age_keyMap",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"."type" AS "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age_type",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"."valueEn" AS "c11ce122c132f445943f0a3fcf274c545b43ccce",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"."valueVi" AS "41e4dcd5c579d5e855b90e709bf3cb24992fade3",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"."description" AS "baa1b87a0fcea02a278fc0e75cb7157d83a0b6fd",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"."createdAt" AS "0c30c38fb78fe5e79fc721700ff0d8468f8d995b",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"."updatedAt" AS "5450dd2f17a20b1fa343178df0b544e1a76a88c4",

    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"."id" AS "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type_id",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"."keyMap" AS "64300d5cce7069b90a221cd8057e865b8b8ef51e",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"."type" AS "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type_type",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"."valueEn" AS "26eed43cb924a45547252b0df44e771fc3cf2fed",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"."valueVi" AS "82b034516c327fc4b9c8daebe65f3a7d9b9bba4c",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"."description" AS "0d7b95e780a4c1b97c77c96151c338916eb4e3a4",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"."createdAt" AS "6cf248d50d904950b9c9324ca6d8b3539fe805e4",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"."updatedAt" AS "b1429b52b02d15068e7261780165cc30bd1780b9",

    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"."id" AS "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country_id",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"."keyMap" AS "4fe61de7b232dff451e4770a0db2cd0b99dfc53e",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"."type" AS "7f583ab9478704666478e7031679540072f1fc0f",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"."valueEn" AS "3ac3f4958989f224673420f1a8da3b01b98f5c6d",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"."valueVi" AS "9195b664d61c65303ddca28f5f2fc6766e8503df",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"."description" AS "7276b829ae8681c74434c1c6e09872fd88b08eb4",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"."createdAt" AS "9b6ab8f7b114fa3e66192c34a0096a8981a9b9d6",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"."updatedAt" AS "cd756a340fac763cc4760f51978f1c594d41dd33",

    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"."id" AS "a53e5344716fb2f71ebd4c65db4ffe043e3ebc7a",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"."keyMap" AS "de6ab6bc3a21722390ebd6cee7f30553152f0762",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"."type" AS "3678ad42f1f3129cef925534b04fc17b084b7d67",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"."valueEn" AS "f325b154199cd65defb603d1a64fc34130092835",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"."valueVi" AS "590daab0fa3b6d3392d1ec32e4962c45f8d3c745",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"."description" AS "f00d9e24ee72cf7aeb82b743b1e9c927a2f32417",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"."createdAt" AS "dd33d546d41a67cdae7d745a985842ea4bf613e9",
    "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"."updatedAt" AS "7d866dbd3b7dd15db9976c881e1dea02ca1f2c06",

    "c46d09c8725370b92c69d49ae4144d6ea28e405e"."id" AS "c46d09c8725370b92c69d49ae4144d6ea28e405e_id",
    "c46d09c8725370b92c69d49ae4144d6ea28e405e"."keyMap" AS "c46d09c8725370b92c69d49ae4144d6ea28e405e_keyMap",
    "c46d09c8725370b92c69d49ae4144d6ea28e405e"."type" AS "c46d09c8725370b92c69d49ae4144d6ea28e405e_type",
    "c46d09c8725370b92c69d49ae4144d6ea28e405e"."valueEn" AS "c46d09c8725370b92c69d49ae4144d6ea28e405e_valueEn",
    "c46d09c8725370b92c69d49ae4144d6ea28e405e"."valueVi" AS "c46d09c8725370b92c69d49ae4144d6ea28e405e_valueVi",
    "c46d09c8725370b92c69d49ae4144d6ea28e405e"."description" AS "c46d09c8725370b92c69d49ae4144d6ea28e405e_description",
    "c46d09c8725370b92c69d49ae4144d6ea28e405e"."createdAt" AS "c46d09c8725370b92c69d49ae4144d6ea28e405e_createdAt",
    "c46d09c8725370b92c69d49ae4144d6ea28e405e"."updatedAt" AS "c46d09c8725370b92c69d49ae4144d6ea28e405e_updatedAt",

    "FilmActor__FilmActor_actor"."actor_id" AS "FilmActor__FilmActor_actor_actor_id",
    "FilmActor__FilmActor_actor"."actor_name" AS "FilmActor__FilmActor_actor_actor_name",
    "FilmActor__FilmActor_actor"."slug" AS "FilmActor__FilmActor_actor_slug",
    "FilmActor__FilmActor_actor"."shortBio" AS "FilmActor__FilmActor_actor_shortBio",
    "FilmActor__FilmActor_actor"."gender_code" AS "FilmActor__FilmActor_actor_gender_code",
    "FilmActor__FilmActor_actor"."birth_date" AS "FilmActor__FilmActor_actor_birth_date",
    "FilmActor__FilmActor_actor"."nationality_code" AS "FilmActor__FilmActor_actor_nationality_code",
    "FilmActor__FilmActor_actor"."avatar_url" AS "FilmActor__FilmActor_actor_avatar_url",
    "FilmActor__FilmActor_actor"."createdAt" AS "FilmActor__FilmActor_actor_createdAt",
    "FilmActor__FilmActor_actor"."updatedAt" AS "FilmActor__FilmActor_actor_updatedAt",
    "FilmActor__FilmActor_actor"."deletedAt" AS "FilmActor__FilmActor_actor_deletedAt",
    "FilmActor__FilmActor_actor"."createdBy" AS "FilmActor__FilmActor_actor_createdBy",
    "FilmActor__FilmActor_actor"."updatedBy" AS "FilmActor__FilmActor_actor_updatedBy",
    "FilmActor__FilmActor_actor"."deletedBy" AS "FilmActor__FilmActor_actor_deletedBy"

  FROM "film_actors" "FilmActor"

  LEFT JOIN "films" "FilmActor__FilmActor_film"
    ON "FilmActor__FilmActor_film"."filmId" = "FilmActor"."film_id"
    AND "FilmActor__FilmActor_film"."deletedAt" IS NULL

  LEFT JOIN "all_code" "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"
    ON "FilmActor__FilmActor_film__FilmActor__FilmActor_film_age"."keyMap" =
      "FilmActor__FilmActor_film"."ageCode"

  LEFT JOIN "all_code" "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"
    ON "FilmActor__FilmActor_film__FilmActor__FilmActor_film_type"."keyMap" =
      "FilmActor__FilmActor_film"."typeCode"

  LEFT JOIN "all_code" "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"
    ON "FilmActor__FilmActor_film__FilmActor__FilmActor_film_country"."keyMap" =
      "FilmActor__FilmActor_film"."countryCode"

  LEFT JOIN "all_code" "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"
    ON "FilmActor__FilmActor_film__FilmActor__FilmActor_film_language"."keyMap" =
      "FilmActor__FilmActor_film"."langCode"

  LEFT JOIN "all_code" "c46d09c8725370b92c69d49ae4144d6ea28e405e"
    ON "c46d09c8725370b92c69d49ae4144d6ea28e405e"."keyMap" =
      "FilmActor__FilmActor_film"."publicStatusCode"

  LEFT JOIN "actors" "FilmActor__FilmActor_actor"
    ON "FilmActor__FilmActor_actor"."actor_id" = "FilmActor"."actor_id"
    AND "FilmActor__FilmActor_actor"."deletedAt" IS NULL

  WHERE "FilmActor"."deletedAt" IS NULL;
  `,

  film_by_director: `
    SELECT
    "FilmDirector"."film_director_id" AS "FilmDirector_film_director_id",
    "FilmDirector"."is_main" AS "FilmDirector_is_main",
    "FilmDirector"."created_at" AS "FilmDirector_created_at",
    "FilmDirector"."updated_at" AS "FilmDirector_updated_at",
    "FilmDirector"."deletedAt" AS "FilmDirector_deletedAt",
    "FilmDirector"."createdBy" AS "FilmDirector_createdBy",
    "FilmDirector"."updatedBy" AS "FilmDirector_updatedBy",
    "FilmDirector"."deletedBy" AS "FilmDirector_deletedBy",
    "FilmDirector"."film_id" AS "FilmDirector_film_id",
    "FilmDirector"."director_id" AS "FilmDirector_director_id",

    "FilmDirector__FilmDirector_film"."filmId" AS "FilmDirector__FilmDirector_film_filmId",
    "FilmDirector__FilmDirector_film"."originalTitle" AS "FilmDirector__FilmDirector_film_originalTitle",
    "FilmDirector__FilmDirector_film"."title" AS "FilmDirector__FilmDirector_film_title",
    "FilmDirector__FilmDirector_film"."description" AS "FilmDirector__FilmDirector_film_description",
    "FilmDirector__FilmDirector_film"."releaseDate" AS "FilmDirector__FilmDirector_film_releaseDate",
    "FilmDirector__FilmDirector_film"."year" AS "FilmDirector__FilmDirector_film_year",
    "FilmDirector__FilmDirector_film"."thumbUrl" AS "FilmDirector__FilmDirector_film_thumbUrl",
    "FilmDirector__FilmDirector_film"."slug" AS "FilmDirector__FilmDirector_film_slug",
    "FilmDirector__FilmDirector_film"."duration" AS "FilmDirector__FilmDirector_film_duration",
    "FilmDirector__FilmDirector_film"."view" AS "FilmDirector__FilmDirector_film_view",
    "FilmDirector__FilmDirector_film"."ageCode" AS "FilmDirector__FilmDirector_film_ageCode",
    "FilmDirector__FilmDirector_film"."typeCode" AS "FilmDirector__FilmDirector_film_typeCode",
    "FilmDirector__FilmDirector_film"."countryCode" AS "FilmDirector__FilmDirector_film_countryCode",
    "FilmDirector__FilmDirector_film"."langCode" AS "FilmDirector__FilmDirector_film_langCode",
    "FilmDirector__FilmDirector_film"."publicStatusCode" AS "FilmDirector__FilmDirector_film_publicStatusCode",
    "FilmDirector__FilmDirector_film"."createdAt" AS "FilmDirector__FilmDirector_film_createdAt",
    "FilmDirector__FilmDirector_film"."updatedAt" AS "FilmDirector__FilmDirector_film_updatedAt",
    "FilmDirector__FilmDirector_film"."deletedAt" AS "FilmDirector__FilmDirector_film_deletedAt",
    "FilmDirector__FilmDirector_film"."createdById" AS "FilmDirector__FilmDirector_film_createdBy",
    "FilmDirector__FilmDirector_film"."updatedById" AS "FilmDirector__FilmDirector_film_updatedBy",
    "FilmDirector__FilmDirector_film"."deletedById" AS "FilmDirector__FilmDirector_film_deletedBy",

    "88fa8197b8df923d0dae973e54a3b9e8bfed2194"."id" AS "88fa8197b8df923d0dae973e54a3b9e8bfed2194_id",
    "88fa8197b8df923d0dae973e54a3b9e8bfed2194"."keyMap" AS "88fa8197b8df923d0dae973e54a3b9e8bfed2194_keyMap",
    "88fa8197b8df923d0dae973e54a3b9e8bfed2194"."type" AS "88fa8197b8df923d0dae973e54a3b9e8bfed2194_type",
    "88fa8197b8df923d0dae973e54a3b9e8bfed2194"."valueEn" AS "88fa8197b8df923d0dae973e54a3b9e8bfed2194_valueEn",
    "88fa8197b8df923d0dae973e54a3b9e8bfed2194"."valueVi" AS "88fa8197b8df923d0dae973e54a3b9e8bfed2194_valueVi",
    "88fa8197b8df923d0dae973e54a3b9e8bfed2194"."description" AS "88fa8197b8df923d0dae973e54a3b9e8bfed2194_description",
    "88fa8197b8df923d0dae973e54a3b9e8bfed2194"."createdAt" AS "88fa8197b8df923d0dae973e54a3b9e8bfed2194_createdAt",
    "88fa8197b8df923d0dae973e54a3b9e8bfed2194"."updatedAt" AS "88fa8197b8df923d0dae973e54a3b9e8bfed2194_updatedAt",

    "7f6f3e477fec154a28a677b795a48720e0a8ba09"."id" AS "7f6f3e477fec154a28a677b795a48720e0a8ba09_id",
    "7f6f3e477fec154a28a677b795a48720e0a8ba09"."keyMap" AS "7f6f3e477fec154a28a677b795a48720e0a8ba09_keyMap",
    "7f6f3e477fec154a28a677b795a48720e0a8ba09"."type" AS "7f6f3e477fec154a28a677b795a48720e0a8ba09_type",
    "7f6f3e477fec154a28a677b795a48720e0a8ba09"."valueEn" AS "7f6f3e477fec154a28a677b795a48720e0a8ba09_valueEn",
    "7f6f3e477fec154a28a677b795a48720e0a8ba09"."valueVi" AS "7f6f3e477fec154a28a677b795a48720e0a8ba09_valueVi",
    "7f6f3e477fec154a28a677b795a48720e0a8ba09"."description" AS "7f6f3e477fec154a28a677b795a48720e0a8ba09_description",
    "7f6f3e477fec154a28a677b795a48720e0a8ba09"."createdAt" AS "7f6f3e477fec154a28a677b795a48720e0a8ba09_createdAt",
    "7f6f3e477fec154a28a677b795a48720e0a8ba09"."updatedAt" AS "7f6f3e477fec154a28a677b795a48720e0a8ba09_updatedAt",

    "5c0f3624c86580fa334106b1ddf06f98e226d6ca"."id" AS "5c0f3624c86580fa334106b1ddf06f98e226d6ca_id",
    "5c0f3624c86580fa334106b1ddf06f98e226d6ca"."keyMap" AS "5c0f3624c86580fa334106b1ddf06f98e226d6ca_keyMap",
    "5c0f3624c86580fa334106b1ddf06f98e226d6ca"."type" AS "5c0f3624c86580fa334106b1ddf06f98e226d6ca_type",
    "5c0f3624c86580fa334106b1ddf06f98e226d6ca"."valueEn" AS "5c0f3624c86580fa334106b1ddf06f98e226d6ca_valueEn",
    "5c0f3624c86580fa334106b1ddf06f98e226d6ca"."valueVi" AS "5c0f3624c86580fa334106b1ddf06f98e226d6ca_valueVi",
    "5c0f3624c86580fa334106b1ddf06f98e226d6ca"."description" AS "5c0f3624c86580fa334106b1ddf06f98e226d6ca_description",
    "5c0f3624c86580fa334106b1ddf06f98e226d6ca"."createdAt" AS "5c0f3624c86580fa334106b1ddf06f98e226d6ca_createdAt",
    "5c0f3624c86580fa334106b1ddf06f98e226d6ca"."updatedAt" AS "5c0f3624c86580fa334106b1ddf06f98e226d6ca_updatedAt",

    "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"."id" AS "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a_id",
    "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"."keyMap" AS "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a_keyMap",
    "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"."type" AS "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a_type",
    "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"."valueEn" AS "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a_valueEn",
    "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"."valueVi" AS "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a_valueVi",
    "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"."description" AS "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a_description",
    "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"."createdAt" AS "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a_createdAt",
    "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"."updatedAt" AS "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a_updatedAt",

    "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"."id" AS "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6_id",
    "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"."keyMap" AS "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6_keyMap",
    "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"."type" AS "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6_type",
    "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"."valueEn" AS "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6_valueEn",
    "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"."valueVi" AS "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6_valueVi",
    "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"."description" AS "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6_description",
    "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"."createdAt" AS "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6_createdAt",
    "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"."updatedAt" AS "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6_updatedAt",

    "FilmDirector__FilmDirector_director"."director_id" AS "FilmDirector__FilmDirector_director_director_id",
    "FilmDirector__FilmDirector_director"."director_name" AS "FilmDirector__FilmDirector_director_director_name",
    "FilmDirector__FilmDirector_director"."slug" AS "FilmDirector__FilmDirector_director_slug",
    "FilmDirector__FilmDirector_director"."birth_date" AS "FilmDirector__FilmDirector_director_birth_date",
    "FilmDirector__FilmDirector_director"."gender_code" AS "FilmDirector__FilmDirector_director_gender_code",
    "FilmDirector__FilmDirector_director"."story" AS "FilmDirector__FilmDirector_director_story",
    "FilmDirector__FilmDirector_director"."avatarUrl" AS "FilmDirector__FilmDirector_director_avatarUrl",
    "FilmDirector__FilmDirector_director"."nationality_code" AS "FilmDirector__FilmDirector_director_nationality_code",
    "FilmDirector__FilmDirector_director"."createdAt" AS "FilmDirector__FilmDirector_director_createdAt",
    "FilmDirector__FilmDirector_director"."updatedAt" AS "FilmDirector__FilmDirector_director_updatedAt",
    "FilmDirector__FilmDirector_director"."deletedAt" AS "FilmDirector__FilmDirector_director_deletedAt",
    "FilmDirector__FilmDirector_director"."createdBy" AS "FilmDirector__FilmDirector_director_createdBy",
    "FilmDirector__FilmDirector_director"."updatedBy" AS "FilmDirector__FilmDirector_director_updatedBy",
    "FilmDirector__FilmDirector_director"."deletedBy" AS "FilmDirector__FilmDirector_director_deletedBy"

  FROM "film_directors" "FilmDirector"

  LEFT JOIN "films" "FilmDirector__FilmDirector_film"
    ON "FilmDirector__FilmDirector_film"."filmId" = "FilmDirector"."film_id"
    AND "FilmDirector__FilmDirector_film"."deletedAt" IS NULL

  LEFT JOIN "all_code" "88fa8197b8df923d0dae973e54a3b9e8bfed2194"
    ON "88fa8197b8df923d0dae973e54a3b9e8bfed2194"."keyMap" =
      "FilmDirector__FilmDirector_film"."ageCode"

  LEFT JOIN "all_code" "7f6f3e477fec154a28a677b795a48720e0a8ba09"
    ON "7f6f3e477fec154a28a677b795a48720e0a8ba09"."keyMap" =
      "FilmDirector__FilmDirector_film"."typeCode"

  LEFT JOIN "all_code" "5c0f3624c86580fa334106b1ddf06f98e226d6ca"
    ON "5c0f3624c86580fa334106b1ddf06f98e226d6ca"."keyMap" =
      "FilmDirector__FilmDirector_film"."countryCode"

  LEFT JOIN "all_code" "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"
    ON "16456b5430d7934c9224bbf9b45f5cc3b1bcc40a"."keyMap" =
      "FilmDirector__FilmDirector_film"."langCode"

  LEFT JOIN "all_code" "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"
    ON "be0eec67de9b3e07bdb1443fee4a5b2b48647ca6"."keyMap" =
      "FilmDirector__FilmDirector_film"."publicStatusCode"

  LEFT JOIN "directors" "FilmDirector__FilmDirector_director"
    ON "FilmDirector__FilmDirector_director"."director_id" = "FilmDirector"."director_id"
    AND "FilmDirector__FilmDirector_director"."deletedAt" IS NULL

  WHERE "FilmDirector"."deletedAt" IS NULL
  ;
  `,
};
