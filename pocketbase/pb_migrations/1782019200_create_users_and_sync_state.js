/// <reference path="../pb_data/types.d.ts" />

migrate(
  function (app) {
    // --- users (auth collection) ---
    let usersCollection;

    try {
      usersCollection = app.findCollectionByNameOrId("users");
    } catch (e) {
      usersCollection = new Collection({
        name: "users",
        type: "auth",
        listRule: null,
        viewRule: "id = @request.auth.id",
        createRule: "",
        updateRule: "id = @request.auth.id",
        deleteRule: null,
        passwordAuth: {
          enabled: true,
          identityFields: ["email"],
        },
        fields: [
          {
            name: "avatar",
            type: "file",
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          },
          {
            name: "firstName",
            type: "text",
            max: 200,
          },
          {
            name: "lastName",
            type: "text",
            max: 200,
          },
          {
            name: "phoneNumber",
            type: "text",
            max: 50,
          },
          {
            name: "shortBio",
            type: "text",
            max: 2000,
          },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_users_email ON users (email)",
          "CREATE UNIQUE INDEX idx_users_username ON users (username)",
        ],
      });

      app.save(usersCollection);
    }

    // Re-fetch to guarantee we have the persisted id
    usersCollection = app.findCollectionByNameOrId("users");

    // --- user_sync_states (base collection) ---
    try {
      app.findCollectionByNameOrId("user_sync_states");
    } catch (e) {
      let syncStates = new Collection({
        name: "user_sync_states",
        type: "base",
        listRule: "user = @request.auth.id",
        viewRule: "user = @request.auth.id",
        createRule: "user = @request.auth.id && user != ''",
        updateRule: "user = @request.auth.id",
        deleteRule: "user = @request.auth.id",
        fields: [
          {
            name: "user",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: usersCollection.id,
            cascadeDelete: true,
          },
          {
            name: "payload",
            type: "json",
            maxSize: 0,
          },
          {
            name: "clientUpdatedAt",
            type: "number",
            required: true,
            min: 0,
          },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_user_sync_states_user ON user_sync_states (user)",
        ],
      });

      app.save(syncStates);
    }
  },
  function (app) {
    try {
      let syncStates = app.findCollectionByNameOrId("user_sync_states");
      app.delete(syncStates);
    } catch (e) {
      // already deleted
    }
  },
);
