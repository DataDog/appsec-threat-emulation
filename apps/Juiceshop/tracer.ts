import tracer from 'dd-trace';
tracer.init({
    appsec:true
});
export default tracer