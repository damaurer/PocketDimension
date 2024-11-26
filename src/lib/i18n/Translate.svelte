<script lang="ts">
	import {t} from '$lib/i18n/i18n.ts'

	export let key: string;
	export let variables: object | undefined = undefined;

</script>


{@html $t(key, variables)}