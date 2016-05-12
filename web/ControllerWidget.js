app.controller('ControllerFreeSMS',
	['$scope', '$popup', '$actions',
	function($scope, $popup, $actions) {

	"use strict";

	// attributes

		// public

			$scope.phones = [];
			$scope.selectedphone = null;

	// methods

		// models

			// phones

			$scope.addPhone = function () {

				$popup.prompt({
					title: 'Nouveau téléphone',
					onconfirm: function(name) {
						socket.emit('plugins.freesms.phone.add', { name : name });
					}
				});

			};
			$scope.editPhone = function (phone) {

				$popup.prompt({
					title: 'Modifier téléphone',
					val: phone.name,
					onconfirm: function(name) {
						phone.name = name;
						socket.emit('plugins.freesms.phone.edit', phone);
					}
				});

			};
			$scope.deletePhone = function (phone) {

				$popup.confirm({
					title: 'Supprimer téléphone',
					message: 'Voulez-vous vraiment supprimer "' + phone.name + '" ?',
					val: phone.name,
					onyes: function() {
						socket.emit('plugins.freesms.phone.delete', phone);
					}
				});

			};

	// constructor

		// events

			// phones

			socket.on('plugins.freesms.phones', function (phones) {

				$scope.$apply(function() {

					$scope.phones = phones;
					$scope.selectedphone = (1 == $scope.phones.length) ? $scope.phones[0] : null;
					
				});
				
			})

			.on('plugins.freesms.phone.added', function (phone) {

				$scope.$apply(function() {

					$scope.phones.push(phone);
					$scope.selectedphone = phone;

				});
				
			})
			.on('plugins.freesms.phone.edited', function (phone) {

				$scope.$apply(function() {

					for (var i = 0; i < $scope.phones.length; ++i) {

						if (phone.id == $scope.phones[i].id) {
							$scope.phones[i] = phone;
							$scope.selectedphone = phone;
							break;
						}

					}
				
				});
				
			});

}]);
