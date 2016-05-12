
"use strict";

// private

	var _sSelectQuery = "SELECT id, name, code, freeapi_login, freeapi_key FROM plugin_phones";

	function _formatePhone(phone) {

		phone.freeapi = {
			login : phone.freeapi_login,
			key : phone.freeapi_key
		};

			delete phone.freeapi_login;
			delete phone.freeapi_key;

		return phone;

	}

// module

module.exports = class DBPluginsPhones {

	constructor (db) {
		this.db = db;
	}

	// read

		lastInserted() {

			let that = this;

			return new Promise(function(resolve, reject) {

				try {

					that.db.get(_sSelectQuery + " ORDER BY id DESC LIMIT 0,1;", [], function(err, row) {
						
						if (err) {
							reject((err.message) ? err.message : err);
						}
						else {
							resolve((row) ? _formatePhone(row) : {});
						}

					});

				}
				catch(e) {
					reject((e.message) ? e.message : e);
				}

			});

		}

		searchById(id) {
			
			let that = this;

			return new Promise(function(resolve, reject) {

				try {

					if (!id) {
						reject('Le téléphone renseigné est incorrect.');
					}
					else {

						that.db.all(_sSelectQuery + " WHERE id = :id ORDER BY name ASC;", { ':id': id }, function(err, rows) {

							if (err) {
								reject((err.message) ? err.message : err);
							}
							else if (!rows || 0 >= rows.length) {
								resolve(null);
							}
							else {
								resolve(_formatePhone(rows[0]));
							}

						});

					}

				}
				catch(e) {
					reject((e.message) ? e.message : e);
				}

			});

		}

		searchByUser(user) {
			
			let that = this;

			return new Promise(function(resolve, reject) {

				try {

					if (!user) {
						reject('Aucun utilisateur renseigné.');
					}
						else if (!user.id) {
							reject("L'utilisateur renseigné n'est pas valide.");
						}
					else {

						that.db.all(_sSelectQuery + " WHERE id_user = :id_user ORDER BY name ASC;", { ':id_user': user.id }, function(err, rows) {

							if (err) {
								reject((err.message) ? err.message : err);
							}
							else if (!rows || 0 >= rows.length) {
								resolve([]);
							}
							else {

								rows.forEach(function(row, i) {
									rows[i] = _formatePhone(row);
								});

								resolve(rows);
								
							}

						});

					}

				}
				catch(e) {
					reject((e.message) ? e.message : e);
				}

			});

		}

		searchByUserByNameOrCode(user, name, code) {
			
			let that = this;

			return new Promise(function(resolve, reject) {

				try {

					if (!user) {
						reject('Aucun utilisateur renseigné.');
					}
						else if (!user.id) {
							reject("L'utilisateur renseigné n'est pas valide.");
						}
					else if (!name) {
						reject('Aucun nom renseigné.');
					}
					else if (!code) {
						reject('Aucun numéro renseigné.');
					}
					else {

						that.db.all(
							_sSelectQuery + " WHERE id_user = :id_user AND (name = :name OR code = :code);",
							{ ':id_user': user.id, ':name': name, ':code': code },
						function(err, rows) {

							if (err) {
								reject((err.message) ? err.message : err);
							}
							else if (!rows || 0 >= rows.length) {
								resolve(null);
							}
							else {
								resolve(_formatePhone(rows[0]));
							}

						});

					}

				}
				catch(e) {
					reject((e.message) ? e.message : e);
				}

			});

		}

	// write

		add (phone) {

			let that = this;

			return new Promise(function(resolve, reject) {

				try {

					if (!phone) {
						reject('Aucun téléphone renseigné.');
					}
					else if (!phone.user) {
						reject('Aucun utilisateur renseigné.');
					}
						else if (!phone.user.id) {
							reject("L'utilisateur renseigné n'est pas valide.");
						}
					else if (!phone.name) {
						reject('Aucun nom renseigné.');
					}
					else if (!phone.code) {
						reject('Aucun numéro renseigné.');
					}
					else {

						that.db.run("INSERT INTO plugin_phones (id_user, name, code) VALUES (:id_user, :name, :code);", {
							':id_user': phone.user.id,
							':name': phone.name,
							':code': phone.code
						}, function(err) {

							if (err) {
								reject((err.message) ? err.message : err);
							}
							else {

								that.lastInserted().then(function(_phone) {

									if (phone.freeapi) {
										_phone.freeapi = phone.freeapi;
										that.edit(_phone).then(resolve).catch(reject);
									}
									else {
										resolve(_phone);
									}

								}).catch(reject);

							}

						});

					}

				}
				catch(e) {
					reject((e.message) ? e.message : e);
				}

			});

		}

		edit (phone) {

			let that = this;

			return new Promise(function(resolve, reject) {

				try {

					if (!phone) {
						reject('Aucun téléphone renseigné.');
					}
						else if (!phone.id) {
							reject('Le téléphone renseigné est incorrect.');
						}
					else if (!phone.name) {
						reject('Aucun nom renseigné.');
					}
					else if (!phone.code) {
						reject('Aucun code renseigné.');
					}
					else {

						that.db.run("UPDATE plugin_phones SET name = :name AND code = :code AND freeapi_login = :freeapi_login AND freeapi_key = :freeapi_key WHERE id = :id;", {
							':id': phone.id,
							':name': phone.name,
							':code': phone.code,
							':freeapi_login': phone.freeapi.login,
							':freeapi_key': phone.freeapi.key
						}, function(err) {

							if (err) {
								reject((err.message) ? err.message : err);
							}
							else {
								resolve(phone);
							}

						});

					}

				}
				catch(e) {
					reject((e.message) ? e.message : e);
				}

			});

		}

		delete (phone) {
			
			let that = this;

			return new Promise(function(resolve, reject) {

				if (!phone) {
					reject('Aucune catégorie renseignée.');
				}
				else if (!phone.id) {
					reject("La catégorie renseignée est invalide.");
				}
				else {

					that.db.run("DELETE FROM plugin_phones WHERE id = :id;", { ':id' : phone.id }, function(err) {

						if (err) {
							reject((err.message) ? err.message : err);
						}
						else {
							resolve();
						}

					});

				}

			});

		}

};
