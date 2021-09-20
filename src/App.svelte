<script lang="ts">
	import router from "page";
	import routes from "./routes";
	let params = null;
	let page = null;

	routes.forEach((route) => {
		router(
			route.path,
			(ctx, next) => {
				params = ctx.params;
				next();
			},

			async () => {
				page = route.component;
			}
		);
	});
	router.start();
</script>

<svelte:component this={page} {params}/>

<svelte:head>
	<style lang="scss">
		@import "./theme/variables.scss";
		@import "./theme/global.scss";
	</style>
</svelte:head>
