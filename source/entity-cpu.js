
class entity_cpu_t extends entity_t {
	_init() {
		this._animation_time = 0;
	}

	_render() {
		this._animation_time += time_elapsed;

		_gl.push_block(this.x, this.z, 4, 17);
		var intensity = this.health == 5 
			? 0.02 + Math.sin(this._animation_time*10+Math.random()*2) * 0.01
			: 0.01;
		_gl.push_light(this.x + 4, 4, this.z + 12, 0.2, 0.4, 1.0, intensity);
	}

	_check(other) {

		if (this.health == 5 && other instanceof(entity_player_t)) {
			this.health = 10;
			cpus_rebooted++;

			var reboot_message = 
				'\n\n\nREBOOTING..._' +
				'SUCCESS\n';

			if (cpus_total-cpus_rebooted > 0) {
				terminal.show_notice(
					reboot_message + 
					(cpus_total-cpus_rebooted)+' SYSTEM(S) STILL OFFLINE'
				);
			}
			else {
				if (current_level != 3) {
					terminal.show_notice(
						reboot_message +
						'ALL SYSTEMS ONLINE\n' +
						'TRIANGULATING POSITION FOR NEXT HOP...___' +
						'TARGET ACQUIRED\n' +
						'JUMPING...',
						next_level
					);
				}
				else {
					terminal.show_notice(
						reboot_message +
						'ALL SYSTEMS ONLINE',
						next_level
					);
				}
			}
			audio_play(audio_sfx_beep);
		}
	}
}
