
"use strict";

// deps

	const	path = require('path'),
			fs = require('simplefs'),

			Phones = require(path.join(__dirname, 'database', 'phones.js'));

// private

	// sql

		function _runSQLFile(Container, SQLFile) {

			return new Promise(function(resolve, reject) {

				try {

					fs.readFileProm(SQLFile, 'utf8').then(function(sql) {

						let queries = [];

						sql.split(';').forEach(function(query) {

							query = query.trim()
										.replace(/--(.*)\s/g, "")
										.replace(/\s/g, " ")
										.replace(/  /g, " ");

							if ('' != query) {
								queries.push(query + ';');
							}

						});

						function executeQueries(i) {

							return new Promise(function(resolve, reject) {

								if (i >= queries.length) {
									resolve();
								}
								else {

									Container.get('db').run(queries[i], [], function(err) {

										if (err) {
											reject((err.message) ? err.message : err);
										}
										else {
											executeQueries(i + 1).then(resolve).catch(reject);
										}

									});

								}

							});

						}

						executeQueries(0).then(resolve).catch(reject);

					}).catch(reject);

				}
				catch(e) {
					reject((e.message) ? e.message : e);
				}

			});

		}

	function _freeSocket(socket) {

		socket.removeAllListeners('plugins.freesms.phone.add');
		socket.removeAllListeners('plugins.freesms.phone.edit');
		socket.removeAllListeners('plugins.freesms.phone.delete');

		socket.removeAllListeners('plugins.freesms.send');

	}

// module

module.exports = class MIAPluginVideosManager extends require('simplepluginsmanager').SimplePlugin {

	constructor () {
 
		super();
 
		this.phones = null;
		this.loaded = false;

	}

	load (Container) {

		let that = this;

		return new Promise(function(resolve, reject) {

			try {
				
				Container.get('users').lastInserted().then(function(user) {

					that.phones = new Categories(Container.get('db'));
					that.loaded = true;

					Container.get('websockets').onDisconnect(_freeSocket).onLog(function(socket) {

						if (that.loaded) {
							
							that.phones.searchByUser(user).then(function(phones) {
								socket.emit('plugins.freesms.phones', phones);
							}).catch(function(err) {
								Container.get('logs').err('-- [plugins/FreeSMS/phones/searchByUser] : ' + ((err.message) ? err.message : err));
								socket.emit('plugins.freesms.error', (err.message) ? err.message : err);
							});

							socket.on('plugins.freesms.phone.add', function (data) {

								if (Container.get('conf').get('debug')) {
									Container.get('logs').log('plugins.freesms.phone.add');
								}

								try {

									that.phones.searchByUserByNameOrCode(user, data.name, data.code).then(function(phone) {

										if (phone) {
											socket.emit('plugins.freesms.error', 'Ce téléphone existe déjà.');
										}
										else {
											
											that.phones.add({
												user: user,
												name : data.name
											}).then(function(phone) {

												Container.get('websockets').emit('plugins.freesms.phone.added', phone);

											}).catch(function(err) {
												Container.get('logs').err('-- [plugins/FreeSMS/phones/add] : ' + err);
												socket.emit('plugins.freesms.error', err);
											})

										}

									}).catch(function(err) {
										Container.get('logs').err('-- [plugins/FreeSMS/phones/searchByUserByNameOrCode] : ' + err);
										socket.emit('plugins.freesms.error', err);
									});

								}
								catch (e) {
									Container.get('logs').err('-- [plugins/FreeSMS/phones/add] : ' + ((e.message) ? e.message : e));
									Container.get('websockets').emit('plugins.freesms.error', ((e.message) ? e.message : e));
								}

							})
							.on('plugins.freesms.phone.edit', function (data) {

								if (Container.get('conf').get('debug')) {
									Container.get('logs').log('plugins.freesms.phone.edit');
								}

								try {

									that.phones.searchById(data.id).then(function(phone) {

										if (!phone) {
											socket.emit('plugins.freesms.error', 'Impossible de trouver ce téléphone.');
										}
										else {
													
											that.phones.searchByUserByNameOrCode(user, data.name, data.code).then(function(_category) {

												if (_category) {
													socket.emit('plugins.freesms.error', 'Ce nom ou ce numéro existe déjà.');
												}
												else {

													phone.name = data.name;
													phone.code = data.code;
													phone.freeapi = data.freeapi;

													that.phones.edit(phone).then(function(phone) {
														Container.get('websockets').emit('plugins.freesms.phone.edited', phone);
													}).catch(function(err) {
														Container.get('logs').err('-- [plugins/FreeSMS/phones/edit] : ' + err);
														socket.emit('plugins.freesms.error', err);
													});

												}
													
											}).catch(function(err) {
												Container.get('logs').err('-- [plugins/FreeSMS/phones/searchByUserByNameOrCode] : ' + err);
												socket.emit('plugins.freesms.error', err);
											});

										}
											
									}).catch(function(err) {
										Container.get('logs').err('-- [plugins/FreeSMS/phones/searchById] : ' + err);
										socket.emit('plugins.freesms.error', err);
									});

								}
								catch (e) {
									Container.get('logs').err('-- [plugins/FreeSMS/phones/edit] : ' + ((e.message) ? e.message : e));
									Container.get('websockets').emit('plugins.freesms.error', ((e.message) ? e.message : e));
								}

							})
							.on('plugins.freesms.phone.delete', function (data) {

								if (Container.get('conf').get('debug')) {
									Container.get('logs').log('plugins.freesms.phone.delete');
								}

								try {

									that.phones.searchById(data.id).then(function(phone) {

										if (!phone) {
											socket.emit('plugins.freesms.error', 'Impossible de trouver ce téléphone.');
										}
										else {

											that.phones.delete(phone).then(function() {

												that.phones.searchByUser(user).then(function(phones) {
													socket.emit('plugins.freesms.phones', phones);
												}).catch(function(err) {

													Container.get('logs').err('-- [plugins/FreeSMS/phones/searchByUser] : ' + ((err.message) ? err.message : err));
													socket.emit('plugins.freesms.error', (err.message) ? err.message : err);

												});
												
											}).catch(function(err) {
												Container.get('logs').err('-- [plugins/FreeSMS/phones/delete] : ' + err);
												socket.emit('plugins.freesms.error', err);
											});

										}
												
									}).catch(function(err) {
										Container.get('logs').err('-- [plugins/FreeSMS/phones/searchById] : ' + err);
										socket.emit('plugins.freesms.error', err);
									});

								}
								catch (e) {
									Container.get('logs').err('-- [plugins/FreeSMS/phones/delete] : ' + ((e.message) ? e.message : e));
									Container.get('websockets').emit('plugins.freesms.error', ((e.message) ? e.message : e));
								}

							});

						}

					});

					resolve();
				
				}).catch(reject);

			}
			catch(e) {
				reject((e.message) ? e.message : e);
			}

		});

	}

	unload (Container) {

		super.unload();

		let that = this;

		return new Promise(function(resolve, reject) {

			try {

				that.phones = null;
				that.loaded = false;

				Container.get('websockets').getSockets().forEach(_freeSocket);

				resolve();

			}
			catch(e) {
				reject((e.message) ? e.message : e);
			}
		
		});

	}

	install (Container) {
		return _runSQLFile(Container, path.join(__dirname, 'database', 'create.sql'));
	}

	update (Container) {

		let that = this;

		return fs.unlinkProm(path.join(__dirname, 'backup.json')).then(function() {
			return that.install(Container);
		});

	}

	uninstall (Container) {
		
		return fs.unlinkProm(path.join(__dirname, 'backup.json')).then(function() {
			return _runSQLFile(Container, path.join(__dirname, 'database', 'delete.sql'));
		});

	}

};
