<script>
    let name = "Template"
</script>

<div class="holder">
    <div class="text">
        This is a <b>{name}</b>
    </div>
</div>


<style lang="scss">
    .holder {
        width: 100vw;
        height: 100%;
        display: grid;
        align-items: center;
        justify-content: center;

        .text {
            padding: 3rem;
            width: 90vw;
            text-align: center;
        }
    }
</style>