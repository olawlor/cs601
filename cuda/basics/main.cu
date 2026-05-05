#include <iostream>
#include <cuda.h>

#define check(cudacall) { int err=cudacall; if (err!=cudaSuccess) std::cout<<"CUDA ERROR "<<err<<" at line "<<__LINE__<<"'s "<<#cudacall<<"\n";}


/* GPU code: set an array to a value */
__global__ void set_array(float *vals,float param) {
	int i=threadIdx.x; /* find my index */
	vals[i]=i+param;
}

/* CPU code: memory movement and kernel calls */
int main(int argc,char *argv[]) {
	int n=16; /* total number of floats */
	float *vals; /* device array of n values */
	check(cudaMalloc( (void**) &vals, n*sizeof(float) )); //Allocate GPU space
	
	set_array<<<1,n>>>(vals,0.1234); /* Initialize the space on the GPU */ 

/* Copy a few elements back to CPU for printing */
	int i=7;
	float f=-999.0; /* CPU copy of value */
	check(cudaMemcpy(&f,&vals[i],sizeof(float),cudaMemcpyDeviceToHost));
	std::cout<<"vals["<<i<<"] = "<<f<<"\n";
        return 0;
}
