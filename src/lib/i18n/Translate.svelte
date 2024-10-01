<script>
	import {t} from '$lib/i18n/i18n.ts'

	export let key;
	export let variables;

</script>


{@html $t(key, variables)}